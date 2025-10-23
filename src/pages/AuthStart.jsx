import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { toE164, isValidPhone } from "../utils/phone";

/**
 * AuthStart - Unified Authentication Component
 * 
 * Three-tab authentication system:
 * 1. Magic Link - Email-based passwordless authentication
 * 2. Email & Password - Traditional sign-in/sign-up
 * 3. Phone (SMS) - SMS OTP authentication via Supabase
 */
export default function AuthStart() {
  const navigate = useNavigate();
  
  // Tab management
  const [activeTab, setActiveTab] = useState(() => {
    // Restore last tab from localStorage
    return localStorage.getItem('yd.auth.tab') || 'magic';
  });
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Tab 1: Magic Link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  
  // Tab 2: Email & Password state
  const [passwordMode, setPasswordMode] = useState("signin"); // 'signin' | 'signup'
  const [emailPasswordForm, setEmailPasswordForm] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Tab 3: Phone state
  const [phoneStep, setPhoneStep] = useState("phone"); // 'phone' | 'verify'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Phone login disabled by default; toggle with VITE_PHONE_LOGIN_ENABLED=1
  const PHONE_LOGIN_ENABLED = import.meta.env.VITE_PHONE_LOGIN_ENABLED === '1';
  
  // Persist tab selection
  useEffect(() => {
    localStorage.setItem('yd.auth.tab', activeTab);
  }, [activeTab]);
  
  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  // Clear errors when switching tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    setMessage("");
    setLoading(false);
  };
  
  // Helper to show friendly error messages
  const getFriendlyError = (error) => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    if (message.includes('invalid phone number')) {
      return 'Please enter a valid phone number.';
    }
    if (message.includes('invalid or expired')) {
      return 'Invalid or expired SMS code. Please try again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link first.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  };
  
  // Navigation after successful authentication
  const handleAuthSuccess = () => {
    console.log('Authentication successful, redirecting to HomeGate');
    navigate("/", { replace: true });
  };
  
  // =============================================================================
  // TAB 1: MAGIC LINK HANDLERS
  // =============================================================================
  
  const handleMagicLink = async (e) => {
    e.preventDefault();
    
    if (!magicEmail.trim()) {
      setError("Please enter your email address");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(magicEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      setMagicSent(true);
      setMessage(`Magic link sent to ${magicEmail}! Check your email and click the link to sign in.`);
      
    } catch (err) {
      console.error("Magic link error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendMagicLink = async () => {
    if (!magicEmail || resendCooldown > 0) return;
    
    try {
      setLoading(true);
      setError("");
      
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      setMessage("New magic link sent! Check your email.");
      setResendCooldown(30);
      
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // =============================================================================
  // TAB 2: EMAIL & PASSWORD HANDLERS
  // =============================================================================
  
  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, confirmPassword } = emailPasswordForm;
    
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    // Signup validation
    if (passwordMode === 'signup') {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        return;
      }
    }
    
    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      let result;
      
      if (passwordMode === 'signin') {
        // Sign in existing user
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
      } else {
        // Sign up new user
        result = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      }
      
      if (result.error) throw result.error;
      
      // Handle successful authentication
      if (passwordMode === 'signin') {
        // Immediate sign-in success
        if (result.data?.session) {
          handleAuthSuccess();
        }
      } else {
        // Sign-up success - may need email confirmation
        if (result.data?.user && !result.data?.session) {
          setMessage("Account created! Please check your email to confirm your account before signing in.");
        } else if (result.data?.session) {
          // Immediate sign-up success (no confirmation required)
          handleAuthSuccess();
        }
      }
      
    } catch (err) {
      console.error("Email/password error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // =============================================================================
  // TAB 3: PHONE (SMS) HANDLERS
  // =============================================================================
  
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }
    
    // Validate phone number
    if (!isValidPhone(phoneNumber)) {
      setError("Please enter a valid phone number");
      return;
    }
    
    // Convert to E.164 format
    const e164Phone = toE164(phoneNumber, 'US');
    if (!e164Phone) {
      setError("Please enter a valid phone number");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
        options: {
          channel: 'sms'
        }
      });
      
      if (error) throw error;
      
      setPhoneStep("verify");
      setMessage(`SMS code sent to ${phoneNumber}`);
      
    } catch (err) {
      console.error("Phone SMS error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSmsVerify = async (e) => {
    e.preventDefault();
    
    if (!smsCode.trim()) {
      setError("Please enter the SMS code");
      return;
    }
    
    if (!/^\d{6}$/.test(smsCode.trim())) {
      setError("Please enter a valid 6-digit code");
      return;
    }
    
    const e164Phone = toE164(phoneNumber, 'US');
    
    try {
      setLoading(true);
      setError("");
      setMessage("");
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: smsCode.trim(),
        type: 'sms'
      });
      
      if (error) throw error;
      
      if (data?.session) {
        handleAuthSuccess();
      }
      
    } catch (err) {
      console.error("SMS verify error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendSms = async () => {
    if (resendCooldown > 0) return;
    
    const e164Phone = toE164(phoneNumber, 'US');
    
    try {
      setLoading(true);
      setError("");
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164Phone,
        options: {
          channel: 'sms'
        }
      });
      
      if (error) throw error;
      
      setMessage("New SMS code sent!");
      setResendCooldown(30);
      
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Back to phone input from SMS verify
  const handleBackToPhone = () => {
    setPhoneStep("phone");
    setSmsCode("");
    setError("");
    setMessage("");
  };
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to YouDating</h1>
          <p className="text-gray-600 mt-2">Sign in to find your perfect match</p>
        </div>
        
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button 
            className={`tab ${activeTab === 'magic' ? 'tab-active' : ''}`}
            onClick={() => switchTab('magic')}
          >
            Magic Link
          </button>
          <button 
            className={`tab ${activeTab === 'password' ? 'tab-active' : ''}`}
            onClick={() => switchTab('password')}
          >
            Email & Password
          </button>
          {PHONE_LOGIN_ENABLED && (
            <button 
              className={`tab ${activeTab === 'phone' ? 'tab-active' : ''}`}
              onClick={() => switchTab('phone')}
            >
              Phone (SMS)
            </button>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        {/* Success Message Display */}
        {message && (
          <div className="alert alert-success mb-4">
            <span>{message}</span>
          </div>
        )}
        
        {/* TAB 1: MAGIC LINK */}
        {activeTab === 'magic' && (
          <div>
            {!magicSent ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="input input-bordered w-full"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-success text-4xl mb-4">📧</div>
                <p className="text-gray-600">
                  Check your email and click the magic link to sign in.
                </p>
                <button
                  onClick={handleResendMagicLink}
                  className={`btn btn-outline btn-sm ${loading ? 'loading' : ''}`}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0 
                    ? `Resend in ${resendCooldown}s` 
                    : loading 
                    ? 'Sending...' 
                    : 'Resend Magic Link'
                  }
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* TAB 2: EMAIL & PASSWORD */}
        {activeTab === 'password' && (
          <div>
            {/* Sign In / Sign Up Toggle */}
            <div className="flex justify-center mb-4">
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${passwordMode === 'signin' ? 'btn-active' : ''}`}
                  onClick={() => setPasswordMode('signin')}
                >
                  Sign In
                </button>
                <button 
                  className={`btn btn-sm ${passwordMode === 'signup' ? 'btn-active' : ''}`}
                  onClick={() => setPasswordMode('signup')}
                >
                  Create Account
                </button>
              </div>
            </div>
            
            <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="input input-bordered w-full"
                  value={emailPasswordForm.email}
                  onChange={(e) => setEmailPasswordForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={emailPasswordForm.password}
                  onChange={(e) => setEmailPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                  required
                />
              </div>
              
              {passwordMode === 'signup' && (
                <div>
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input input-bordered w-full"
                    value={emailPasswordForm.confirmPassword}
                    onChange={(e) => setEmailPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    disabled={loading}
                    required
                  />
                </div>
              )}
              
              <button
                type="submit"
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading 
                  ? (passwordMode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                  : (passwordMode === 'signin' ? 'Sign In' : 'Create Account')
                }
              </button>
            </form>
          </div>
        )}
        
        {/* TAB 3: PHONE */}
        {PHONE_LOGIN_ENABLED && activeTab === 'phone' && (
          <div>
            {phoneStep === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="input input-bordered w-full"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt">We&apos;ll send you a 6-digit SMS code</span>
                  </label>
                </div>
                
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send SMS Code'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-success text-4xl mb-4">📱</div>
                  <p className="text-gray-600 mb-4">
                    Enter the 6-digit code sent to {phoneNumber}
                  </p>
                </div>
                
                <form onSubmit={handleSmsVerify} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">SMS Code</span>
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      className="input input-bordered w-full text-center text-lg tracking-widest"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={loading}
                      maxLength="6"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </form>
                
                <div className="text-center space-x-4">
                  <button
                    onClick={handleResendSms}
                    className="btn btn-outline btn-sm"
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                  
                  <button
                    onClick={handleBackToPhone}
                    className="btn btn-ghost btn-sm"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}