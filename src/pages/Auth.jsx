import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Heart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/api/supabase";
import { createPageUrl } from "@/utils";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("login"); // 'login' | 'sent' | 'verifying'
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check for magic link verification on page load
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        // User is authenticated, redirect to app
        navigate(createPageUrl("discover"));
      } else if (error) {
        setError("Authentication failed. Please try again.");
        setStep("login");
      }
    };

    // Check if this is a magic link callback
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      setStep("verifying");
      handleAuthCallback();
    }
  }, [searchParams, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setStep("sent");
      setMessage(`Magic link sent to ${email}! Check your email and click the link to sign in.`);
      
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!email) return;
    
    try {
      setLoading(true);
      setError("");
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      setMessage("New magic link sent! Check your email.");
      
    } catch (err) {
      setError(err.message || "Failed to resend magic link.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep("login");
    setEmail("");
    setMessage("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <Heart className="w-8 h-8" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to YouDating</h1>
          <p className="text-base-content/70">
            Sign in with your email to find meaningful connections
          </p>
        </div>

        {/* Main Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            
            {/* Login Form */}
            {step === "login" && (
              <>
                <h2 className="card-title justify-center mb-6">Sign In</h2>
                
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email Address</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="input input-bordered input-primary w-full pl-12"
                        disabled={loading}
                        required
                      />
                      <Mail className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="btn btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Magic Link...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Magic Link
                      </>
                    )}
                  </button>
                </form>

                <div className="divider">How it works</div>
                
                <div className="text-sm text-base-content/60 space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    Enter your email address above
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    We'll send you a secure magic link
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    Click the link in your email to sign in instantly
                  </p>
                </div>
              </>
            )}

            {/* Email Sent State */}
            {step === "sent" && (
              <>
                <div className="text-center mb-6">
                  <div className="avatar placeholder mb-4">
                    <div className="bg-success text-success-content rounded-full w-16">
                      <Mail className="w-8 h-8" />
                    </div>
                  </div>
                  <h2 className="card-title justify-center mb-2">Check Your Email</h2>
                  <p className="text-sm text-base-content/70">
                    We sent a magic link to <span className="font-medium">{email}</span>
                  </p>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Magic link sent!</p>
                      <p className="text-base-content/70">
                        Click the link in your email to sign in. The link will expire in 1 hour.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResendLink}
                    disabled={loading}
                    className="btn btn-outline btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend Magic Link"
                    )}
                  </button>

                  <button
                    onClick={resetForm}
                    className="btn btn-ghost w-full"
                  >
                    Use Different Email
                  </button>
                </div>

                <div className="mt-6 p-3 bg-base-200 rounded-lg">
                  <p className="text-xs text-base-content/60 text-center">
                    Having trouble? Check your spam folder or{" "}
                    <button
                      onClick={handleResendLink}
                      className="link link-primary"
                      disabled={loading}
                    >
                      request a new link
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Verifying State */}
            {step === "verifying" && (
              <div className="text-center py-8">
                <div className="avatar placeholder mb-4">
                  <div className="bg-primary text-primary-content rounded-full w-16">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                </div>
                <h2 className="card-title justify-center mb-2">Signing You In</h2>
                <p className="text-base-content/70">
                  Please wait while we verify your magic link...
                </p>
              </div>
            )}

            {/* Success Message */}
            {message && step !== "verifying" && (
              <div className="alert alert-success mt-4">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mt-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-base-content/60">
            No passwords required • Secure & private • GDPR compliant
          </p>
        </div>
      </div>
    </div>
  );
}