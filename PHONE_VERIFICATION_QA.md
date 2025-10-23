# Phone Verification QA Checklist

## Overview
Test the complete phone verification flow from new user registration through successful verification.

## Prerequisites
- [ ] Twilio API credentials configured in environment variables
- [ ] Supabase database has phone verification schema applied
- [ ] libphonenumber-js dependency installed
- [ ] Test phone number available (real number that can receive SMS)

## Happy Path Flow

### 1. New User Registration
- [ ] Navigate to app root `/`
- [ ] Verify redirect to `/auth` (not logged in)
- [ ] Enter valid email address
- [ ] Click "Send Magic Link"
- [ ] Check email and click magic link
- [ ] Verify redirect to `/onboarding`

### 2. Onboarding Flow
- [ ] Complete steps 1-5 (basic profile information)
- [ ] Reach step 6: "Phone Verification"
- [ ] Verify phone input field is present
- [ ] Verify "Continue" button is disabled initially

### 3. Phone Number Entry
- [ ] Enter valid phone number (e.g., +1234567890)
- [ ] Verify "Continue" button becomes enabled
- [ ] Click "Continue"
- [ ] Verify UI shows "Sending verification code..."
- [ ] Verify transition to step 7: "Verify Phone"

### 4. SMS Code Verification
- [ ] Check test phone receives SMS with 6-digit code
- [ ] Verify SMS sender shows "Twilio" or configured brand
- [ ] Enter received 6-digit code
- [ ] Click "Verify Code"
- [ ] Verify success message appears
- [ ] Verify automatic redirect to `/discover`

### 5. Database Verification
- [ ] Open Supabase dashboard → Table Editor → profiles
- [ ] Find user record by email
- [ ] Verify `phone_e164` field contains formatted phone (e.g., "+1234567890")
- [ ] Verify `phone_verified` field is `true`
- [ ] Verify `verify_request_id` field contains Twilio identifier or null

### 6. Route Protection Test
- [ ] Manually navigate to `/discover`
- [ ] Verify access is granted (no redirect)
- [ ] Manually navigate to `/matches`
- [ ] Verify access is granted (protected route accessible)

## Error Scenarios

### Wrong Verification Code
- [ ] Complete phone entry (steps 1-3 above)
- [ ] Enter incorrect 6-digit code (e.g., "123456")
- [ ] Click "Verify Code"
- [ ] Verify error message: "Invalid verification code"
- [ ] Verify user remains on verification step
- [ ] Verify code input is cleared
- [ ] Enter correct code to continue

### Expired Verification Code
- [ ] Complete phone entry (steps 1-3 above)
- [ ] Wait 10+ minutes (Twilio default expiry)
- [ ] Enter the original code
- [ ] Click "Verify Code"
- [ ] Verify error message: "Verification code has expired"
- [ ] Use "Resend Code" to get new code
- [ ] Enter new code to verify

### Resend Code Flow
- [ ] Complete phone entry (steps 1-3 above)
- [ ] Click "Resend Code" button
- [ ] Verify button shows "Resending..." state
- [ ] Verify new SMS arrives at test phone
- [ ] Verify success message: "New code sent"
- [ ] Enter new code to verify

### Invalid Phone Numbers
- [ ] Enter invalid phone: "123" → Verify error message
- [ ] Enter invalid phone: "abc" → Verify error message  
- [ ] Enter invalid phone: "+1" → Verify error message
- [ ] Enter valid phone to continue

### Network/API Errors
- [ ] Temporarily disable internet during code send
- [ ] Verify error message: "Failed to send verification code"
- [ ] Re-enable internet and retry
- [ ] Verify successful code sending

## Edge Cases

### Phone Number Already Verified
- [ ] Complete verification for User A
- [ ] Register new User B with same phone number
- [ ] Verify error: "Phone number already verified by another user"
- [ ] Use different phone number to continue

### Session Management
- [ ] Start phone verification process
- [ ] Close browser tab
- [ ] Reopen app
- [ ] Verify redirect to `/onboarding` 
- [ ] Verify phone verification state is preserved

### Route Protection Edge Cases
- [ ] Complete onboarding but skip phone verification (manual DB edit)
- [ ] Set `onboarding_complete=true`, `phone_verified=false`
- [ ] Navigate to `/discover`
- [ ] Verify redirect to `/onboarding` for phone verification

## Cleanup After Testing
- [ ] Remove test user from Supabase auth.users
- [ ] Remove test profile from profiles table
- [ ] Clear any test data from verification logs

## Common Issues & Debugging

### No SMS Received
- Check Twilio API credentials
- Verify phone number format (E.164)
- Check Twilio account balance
- Verify test phone can receive SMS

### Database Errors
- Check Supabase connection
- Verify RLS policies allow profile updates
- Check admin client permissions

### Route Issues
- Clear browser cache
- Check React Router setup
- Verify ProtectedRoute configuration

## Expected Response Times
- Magic link email: < 30 seconds
- SMS delivery: < 60 seconds  
- Code verification: < 5 seconds
- Route redirects: < 2 seconds

---

**Test Environment**: Use staging/development environment only  
**Test Duration**: ~15-20 minutes for complete flow  
**Required Access**: Supabase dashboard, test phone number, Twilio dashboard (optional)