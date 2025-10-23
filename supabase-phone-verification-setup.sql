-- ============================================================================
-- Supabase Phone Verification Setup for YouDating Profiles Table
-- ============================================================================
-- This script adds phone verification fields to the existing profiles table
-- while preserving all existing RLS policies and data.
-- 
-- Fields Added:
-- - phone_e164: Phone number in E.164 format (e.g., +1234567890)
-- - phone_verified: Boolean flag for verification status
-- - verify_request_id: Stores verification request ID from SMS provider
-- ============================================================================

-- Add phone verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_e164 text,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verify_request_id text;

-- Add comments for documentation
COMMENT ON COLUMN profiles.phone_e164 IS 'Phone number in E.164 international format (e.g., +1234567890)';
COMMENT ON COLUMN profiles.phone_verified IS 'Boolean flag indicating if phone number has been verified';
COMMENT ON COLUMN profiles.verify_request_id IS 'Verification request ID from SMS provider (e.g., Twilio Verify)';

-- Create index on phone_e164 for efficient lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_e164 ON profiles(phone_e164);

-- Create index on phone_verified for filtering verified users
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON profiles(phone_verified) WHERE phone_verified = true;

-- ============================================================================
-- RLS Policies (Owner-Only Access)
-- ============================================================================
-- Note: Existing RLS policies should already cover these new columns.
-- The following policies ensure owner-only access specifically for phone fields.

-- Policy for phone number updates (users can only update their own phone)
CREATE POLICY IF NOT EXISTS "Users can update their own phone number" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id OR auth.uid()::text = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid()::text = user_id);

-- Policy for phone verification status updates
CREATE POLICY IF NOT EXISTS "Users can update their own phone verification" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id OR auth.uid()::text = user_id)
    WITH CHECK (auth.uid() = id OR auth.uid()::text = user_id);

-- ============================================================================
-- Verification Helper Functions (Optional)
-- ============================================================================

-- Function to format phone number to E.164
CREATE OR REPLACE FUNCTION format_phone_e164(phone_input text, country_code text DEFAULT '+1')
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- Remove all non-digit characters
    phone_input := regexp_replace(phone_input, '[^0-9]', '', 'g');
    
    -- If phone starts with country code digits, return with + prefix
    IF phone_input ~ '^1[0-9]{10}$' AND country_code = '+1' THEN
        RETURN '+' || phone_input;
    END IF;
    
    -- If phone is 10 digits and country code is +1, prepend country code
    IF length(phone_input) = 10 AND country_code = '+1' THEN
        RETURN '+1' || phone_input;
    END IF;
    
    -- Otherwise, prepend the provided country code
    IF NOT phone_input ~ '^\+' THEN
        RETURN country_code || phone_input;
    END IF;
    
    RETURN phone_input;
END;
$$;

-- Function to check if phone number is valid E.164 format
CREATE OR REPLACE FUNCTION is_valid_e164_phone(phone text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if phone matches E.164 format: +[country code][number]
    -- Length should be between 8-15 characters including +
    RETURN phone ~ '^\+[1-9]\d{6,14}$';
END;
$$;

-- ============================================================================
-- Usage Examples
-- ============================================================================

/*
-- Example 1: Update user's phone number
UPDATE profiles 
SET 
    phone_e164 = format_phone_e164('(555) 123-4567'),
    phone_verified = false,
    verify_request_id = NULL
WHERE id = auth.uid();

-- Example 2: Mark phone as verified after SMS confirmation
UPDATE profiles 
SET 
    phone_verified = true,
    verify_request_id = NULL
WHERE id = auth.uid() AND verify_request_id = 'your_verification_id';

-- Example 3: Query users with verified phone numbers
SELECT id, first_name, phone_e164, phone_verified 
FROM profiles 
WHERE phone_verified = true AND phone_e164 IS NOT NULL;

-- Example 4: Check if phone number is already taken
SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE phone_e164 = '+15551234567' 
    AND phone_verified = true
    AND id != auth.uid()
) as phone_taken;
*/

-- ============================================================================
-- Verification Complete
-- ============================================================================
-- Run this query to verify the changes were applied successfully:

SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('phone_e164', 'phone_verified', 'verify_request_id')
ORDER BY ordinal_position;

-- Expected output:
-- phone_e164       | text    | NULL  | YES
-- phone_verified   | boolean | false | YES  
-- verify_request_id| text    | NULL  | YES