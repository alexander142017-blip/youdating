/**
 * Vonage SMS Verification Start - Vercel API Route
 * 
 * Starts SMS verification for authenticated user's phone number
 * POST /api/phone/start
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE: Service role key (server-side only)
 * - VONAGE_API_KEY: Vonage API key
 * - VONAGE_API_SECRET: Vonage API secret
 * - VERIFY_BRAND: Brand name for SMS (optional, defaults to "YouDating")
 * 
 * @param {import('vercel').VercelRequest} req
 * @param {import('vercel').VercelResponse} res
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (server-side only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ok: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Check required environment variables
    const requiredEnvVars = [
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_ROLE', 
      'VONAGE_API_KEY', 
      'VONAGE_API_SECRET'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        return res.status(500).json({ 
          ok: false, 
          error: 'Server configuration error' 
        });
      }
    }

    // Extract phone number from request body
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Phone number is required' 
      });
    }

    // Validate E.164 format (basic check)
    if (!phone.match(/^\+[1-9]\d{6,14}$/)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Phone number must be in E.164 format (e.g., +1234567890)' 
      });
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Missing or invalid Authorization header' 
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify user with Supabase admin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid or expired access token' 
      });
    }

    // Check if phone number is already verified by another user
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('id, phone_e164')
      .eq('phone_e164', phone)
      .eq('phone_verified', true)
      .neq('id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Database query error:', existingError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Database error while checking phone availability' 
      });
    }

    if (existingUser) {
      return res.status(409).json({ 
        ok: false, 
        error: 'Phone number is already verified by another user' 
      });
    }

    // Start Vonage verification
    const vonageAuth = Buffer.from(
      `${process.env.VONAGE_API_KEY}:${process.env.VONAGE_API_SECRET}`
    ).toString('base64');

    const vonageResponse = await fetch('https://api.nexmo.com/v2/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${vonageAuth}`
      },
      body: JSON.stringify({
        brand: process.env.VERIFY_BRAND || 'YouDating',
        workflow: [{
          channel: 'sms',
          to: phone
        }]
      })
    });

    const vonageData = await vonageResponse.json();

    if (!vonageResponse.ok) {
      console.error('Vonage API error:', vonageData);
      return res.status(400).json({ 
        ok: false, 
        error: vonageData.detail || vonageData.title || 'SMS verification failed to start' 
      });
    }

    const requestId = vonageData.request_id;

    if (!requestId) {
      console.error('No request_id returned from Vonage:', vonageData);
      return res.status(500).json({ 
        ok: false, 
        error: 'Invalid response from SMS service' 
      });
    }

    // Update user profile with phone details
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone_e164: phone,
        phone_verified: false,
        verify_request_id: requestId
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to save verification request' 
      });
    }

    // Success response
    return res.status(200).json({ 
      ok: true, 
      request_id: requestId,
      message: 'SMS verification code sent successfully'
    });

  } catch (error) {
    console.error('Verification start error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}