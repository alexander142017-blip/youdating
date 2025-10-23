import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";

/**
 * AuthStart - Streamlined Authentication Component
 * 
 * Two-mode authentication system:
 * 1. Create Account - Email/password signup with automatic email confirmation
 * 2. Sign In - Email/password authentication
 */
export default function AuthStart() {
  const navigate = useNavigate();
  
  // Form mode management
  const [formMode, setFormMode] = useState('signin'); // 'signin' | 'signup'
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Phone login disabled by default; toggle with VITE_PHONE_LOGIN_ENABLED=1
  const PHONE_LOGIN_ENABLED = import.meta.env.VITE_PHONE_LOGIN_ENABLED === '1';
  
  // Clear errors when switching modes
  const switchMode = (mode) => {
    setFormMode(mode);
    setError("");
    setMessage("");
    setLoading(false);
    // Reset form
    setFormData({
      email: "",
      password: "",
      confirmPassword: ""
    });
  };
  
  // Helper to show friendly error messages
  const getFriendlyError = (error) => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('password should be at least')) {
      return 'Password must be at least 8 characters long.';
    }
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link first.';
    }
    if (message.includes('user already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    
    return error.message || 'An unexpected error occurred. Please try again.';
  };
  
  // Navigation after successful authentication
  const handleAuthSuccess = () => {
    console.log('Authentication successful, redirecting to HomeGate');
    navigate("/", { replace: true });
  };
  
  // =============================================================================
  // FORM HANDLERS
  // =============================================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { email, password, confirmPassword } = formData;
    
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
    
    // Password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    // Signup validation
    if (formMode === 'signup') {
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
      
      if (formMode === 'signin') {
        // Sign in existing user
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        
        if (result.error) throw result.error;
        
        // Immediate sign-in success
        if (result.data?.session) {
          handleAuthSuccess();
        }
      } else {
        // Sign up new user with automatic email confirmation
        result = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`,
          },
        });
        
        if (result.error) throw result.error;
        
        // Sign-up success - show email confirmation message
        if (result.data?.user && !result.data?.session) {
          setMessage("Check your email to confirm your account.");
        } else if (result.data?.session) {
          // Immediate sign-up success (no confirmation required)
          handleAuthSuccess();
        }
      }
      
    } catch (err) {
      console.error("Authentication error:", err);
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full" style={{ maxWidth: '420px' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to YouDating</h1>
          <p className="text-gray-600">Find your perfect match</p>
        </div>
        
        {/* Two CTA Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button 
            className={`btn ${formMode === 'signup' ? 'btn-primary' : 'btn-outline btn-primary'} w-full`}
            onClick={() => switchMode('signup')}
            disabled={loading}
          >
            Create Account
          </button>
          <button 
            className={`btn ${formMode === 'signin' ? 'btn-primary' : 'btn-outline btn-primary'} w-full`}
            onClick={() => switchMode('signin')}
            disabled={loading}
          >
            Sign In
          </button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Success Message Display */}
        {message && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message}</span>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="input input-bordered w-full"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              disabled={loading}
              required
            />
            <label className="label">
              <span className="label-text-alt">We&apos;ll use this for your account</span>
            </label>
          </div>
          
          <div>
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              required
            />
            <label className="label">
              <span className="label-text-alt">
                {formMode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
              </span>
            </label>
          </div>
          
          {formMode === 'signup' && (
            <div>
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={loading}
                required
              />
              <label className="label">
                <span className="label-text-alt">Must match your password</span>
              </label>
            </div>
          )}
          
          <button
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading 
              ? (formMode === 'signin' ? 'Signing In...' : 'Creating Account...') 
              : (formMode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>
        
        {/* Phone login option (hidden by default) */}
        {PHONE_LOGIN_ENABLED && (
          <div className="divider mt-6">OR</div>
        )}
      </div>
    </div>
  );
}