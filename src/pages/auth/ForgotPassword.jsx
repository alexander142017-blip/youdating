import { useState } from 'react';
import { supabase } from '../../api/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); 
    setMsg(null); 
    setErr(null);
    
    try {
      const redirectTo = `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setMsg('Check your email for a password reset link.');
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Could not send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
          <p className="text-gray-600">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        
        {msg && (
          <div className="alert alert-success mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{msg}</span>
          </div>
        )}
        
        {err && (
          <div className="alert alert-error mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{err}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="input input-bordered w-full" 
              placeholder="your@email.com"
              disabled={loading}
            />
            <label className="label">
              <span className="label-text-alt">We&apos;ll send a password reset link to this email</span>
            </label>
          </div>
          
          <button 
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/auth" className="link link-primary text-sm">
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}