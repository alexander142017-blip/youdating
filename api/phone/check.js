/**
 * Vonage SMS Verification Check - Vercel API Route
 * 
 * Verifies SMS code entered by authenticated user
 * POST /api/phone/check
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE: Service role key (server-side only)
 * - VONAGE_API_KEY: Vonage API key
 * - VONAGE_API_SECRET: Vonage API secret
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

    // Extract verification code from request body
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Verification code is required' 
      });
    }

    // Validate code format (should be 4-8 digits)
    if (!code.match(/^\d{4,8}$/)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Verification code must be 4-8 digits' 
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

    // Get user's verification request ID from profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('verify_request_id, phone_e164, phone_verified')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to fetch user profile' 
      });
    }

    if (!profile || !profile.verify_request_id) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No active verification request found. Please start verification first.' 
      });
    }

    if (profile.phone_verified) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Phone number is already verified' 
      });
    }

    // Verify code with Vonage
    const vonageAuth = Buffer.from(
      `${process.env.VONAGE_API_KEY}:${process.env.VONAGE_API_SECRET}`
    ).toString('base64');

    const vonageResponse = await fetch('https://api.nexmo.com/v2/verify/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${vonageAuth}`
      },
      body: JSON.stringify({
        request_id: profile.verify_request_id,
        code: code
      })
    });

    const vonageData = await vonageResponse.json();

    if (!vonageResponse.ok) {
      console.error('Vonage verification failed:', vonageData);
      
      // Handle specific Vonage error codes
      let errorMessage = 'Invalid verification code';
      
      if (vonageData.type) {
        switch (vonageData.type) {
          case 'https://developer.vonage.com/api-errors/verify#invalid-code':
            errorMessage = 'Invalid verification code. Please try again.';
            break;
          case 'https://developer.vonage.com/api-errors/verify#expired':
            errorMessage = 'Verification code has expired. Please request a new one.';
            break;
          case 'https://developer.vonage.com/api-errors/verify#rate-limit':
            errorMessage = 'Too many attempts. Please wait before trying again.';
            break;
          default:
            errorMessage = vonageData.detail || vonageData.title || 'Verification failed';
        }
      }
      
      return res.status(400).json({ 
        ok: false, 
        error: errorMessage 
      });
    }

    // Verification successful - update user profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone_verified: true,
        verify_request_id: null // Clear the request ID
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to update verification status' 
      });
    }

    // Success response
    return res.status(200).json({ 
      ok: true,
      message: 'Phone number verified successfully',
      phone_verified: true
    });

  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}