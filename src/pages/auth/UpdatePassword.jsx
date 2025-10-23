import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // When the user clicks the email link, Supabase places a session token in the URL hash.
    // After the page mounts, that session becomes available via getSession().
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleUpdate(e) {
    e.preventDefault();
    setMsg(null); 
    setErr(null);
    
    if (password.length < 8) { 
      setErr('Password must be at least 8 characters.'); 
      return; 
    }
    if (password !== confirm) { 
      setErr('Passwords do not match.'); 
      return; 
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Password updated! You can close this tab or return to the app.');
    } catch (e) {
      console.error(e);
      setErr(e.message || 'Could not update password. Open the link from your email again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose a new password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>
        
        {!hasSession && (
          <div className="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>Open this page from the password reset email link so we can securely update your password.</span>
          </div>
        )}
        
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
        
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">New Password</span>
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="input input-bordered w-full" 
              minLength={8} 
              required
              placeholder="••••••••"
              disabled={loading}
            />
            <label className="label">
              <span className="label-text-alt">At least 8 characters</span>
            </label>
          </div>
          
          <div>
            <label className="label">
              <span className="label-text">Confirm Password</span>
            </label>
            <input 
              type="password" 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)}
              className="input input-bordered w-full" 
              minLength={8} 
              required
              placeholder="••••••••"
              disabled={loading}
            />
            <label className="label">
              <span className="label-text-alt">Must match your new password</span>
            </label>
          </div>
          
          <button 
            type="submit"
            className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} 
            disabled={loading || !hasSession}
          >
            {loading ? 'Updating...' : 'Update Password'}
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