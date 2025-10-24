/**
 * Twilio SMS Verification Check - Vercel API Route
 * 
 * Verifies SMS code    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('phone_e164, phone_verified')
      .eq('user_id', user.id)
      .single();red by authenticated user
 * POST /api/phone/check
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

    // Extract verification code from request body
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ ok: false, error: 'code_required' });
    }

    // Validate code format (enhanced validation)
    const codeRegex = /^\d{4,8}$/;
    if (!codeRegex.test(code)) {
      return res.status(400).json({ ok: false, error: 'invalid_code_format' });
    }
    
    // Additional security checks
    if (code.length < 4 || code.length > 8 || code === '0000' || code === '1234') {
      return res.status(400).json({ ok: false, error: 'invalid_code_value' });
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

    // Get user's phone number from profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('phone_e164, phone_verified')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    if (!profile || !profile.phone_e164) {
      return res.status(400).json({ ok: false, error: 'no_phone' });
    }

    if (profile.phone_verified) {
      return res.status(400).json({ ok: false, error: 'already_verified' });
    }

    // Verify code with Twilio
    const resp = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks
      .create({ to: profile.phone_e164, code });

    if (resp.status !== 'approved') {
      console.error('Twilio verification failed:', resp);
      return res.status(400).json({ ok: false, error: 'invalid_or_expired' });
    }

    // Verification successful - update user profile
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        phone_verified: true,
        verify_request_id: null // Clear the request ID
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return res.status(500).json({ ok: false, error: 'database_error' });
    }

    // Success response
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Verification check error:', error);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
}