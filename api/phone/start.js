/**
 * Twilio SMS Verification Start - Vercel API Route
 * 
 * Starts SMS verification for authent    const { data: profile } = await supabase
      .from('profiles')
      .select('updated_at, verify_request_id')
      .eq('user_id', user.id)
      .single();d user's phone number
 * POST /api/phone/start
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE: Service role key (server-side only)
 * - TWILIO_ACCOUNT_SID: Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Twilio Auth Token
 * - TWILIO_VERIFY_SID: Twilio Verify Service SID
 * 
 * @param {import('vercel').VercelRequest} req
 * @param {import('vercel').VercelResponse} res
 */

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Initialize clients
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  try {
    // Check required environment variables
    const requiredEnvVars = [
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_ROLE', 
      'TWILIO_ACCOUNT_SID', 
      'TWILIO_AUTH_TOKEN',
      'TWILIO_VERIFY_SID'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        return res.status(500).json({ ok: false, error: 'server_config_error' });
      }
    }

    // Extract phone number from request body
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'phone_required' });
    }

    // Validate E.164 format (enhanced validation)
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phone) || phone.length < 8 || phone.length > 16) {
      return res.status(400).json({ ok: false, error: 'invalid_phone_format' });
    }
    
    // Additional security checks
    if (phone.includes('..') || phone.includes('--') || phone.replace(/[+\d]/g, '').length > 0) {
      return res.status(400).json({ ok: false, error: 'invalid_phone_characters' });
    }

    // Extract access token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // Verify user with Supabase admin client
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    // Check if phone number is already verified by another user
    const { data: existingUser, error: existingError } = await admin
      .from('profiles')
      .select('id, phone_e164')
      .eq('phone_e164', phone)
      .eq('phone_verified', true)
      .neq('id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Database query error:', existingError);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    if (existingUser) {
      return res.status(409).json({ ok: false, error: 'phone_taken' });
    }

    // Enhanced rate limiting (60s between attempts)
    const { data: profile } = await admin
      .from('profiles')
      .select('updated_at, verify_request_id')
      .eq('id', user.id)
      .single();

    if (profile?.updated_at) {
      const lastUpdate = new Date(profile.updated_at);
      const now = new Date();
      const diffSeconds = (now - lastUpdate) / 1000;
      
      if (diffSeconds < 60) {
        return res.status(429).json({ 
          ok: false, 
          error: 'rate_limited',
          retry_after: Math.ceil(60 - diffSeconds)
        });
      }
    }
    
    // Check for suspicious activity (more than 5 attempts in 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentAttempts, error: attemptError } = await admin
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .gte('updated_at', oneHourAgo.toISOString());
      
    if (!attemptError && recentAttempts && recentAttempts.length > 5) {
      return res.status(429).json({ ok: false, error: 'too_many_attempts' });
    }

    // Start Twilio verification
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });

    // Update user profile with phone details
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        phone_e164: phone,
        phone_verified: false,
        verify_request_id: 'twilio', // Placeholder since Twilio doesn't need stored request_id
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    // Success response
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Verification start error:', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}