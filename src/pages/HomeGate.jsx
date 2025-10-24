import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { supabase } from '../api/supabase';

export default function HomeGate({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        console.log('[HOMEGATE] Starting auth check at path:', loc.pathname);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[HOMEGATE] Session error:', sessionError);
          throw sessionError;
        }
        
        console.log('[HOMEGATE] Session check result:', session ? 'authenticated' : 'not authenticated');
        if (cancelled) return;

        // If not signed in → go to /auth (but don't loop if already there)
        if (!session) {
          console.log('[HOMEGATE] No session, redirecting to auth if needed');
          setLoading(false);
          if (!loc.pathname.startsWith('/auth')) {
            console.log('[HOMEGATE] Redirecting to /auth from:', loc.pathname);
            nav('/auth', { replace: true });
          }
          return;
        }

        // Load current user's profile
        const uid = session.user.id;
        console.log('[HOMEGATE] Loading profile for user:', uid);
        
        const { data: prof, error: profileError } = await supabase
          .from('profiles')
          .select('user_id,onboarding_complete')
          .eq('user_id', uid)
          .maybeSingle();
          
        if (profileError) {
          console.error('[HOMEGATE] Profile fetch error:', profileError);
          throw profileError;
        }
        
        console.log('[HOMEGATE] Profile data:', prof);
        if (cancelled) return;

        setLoading(false);

        // Route decisions (use lowercase canonical paths)
        const at = loc.pathname.toLowerCase();
        console.log('[HOMEGATE] Making routing decision for path:', at, 'with profile:', prof);
        
        if (!prof?.onboarding_complete) {
          console.log('[HOMEGATE] Onboarding incomplete, checking redirect');
          if (!at.startsWith('/onboarding')) {
            console.log('[HOMEGATE] Redirecting to onboarding from:', loc.pathname);
            nav('/onboarding', { replace: true });
          }
        } else {
          console.log('[HOMEGATE] Onboarding complete, checking root/auth redirect');
          if (at === '/' || at === '/auth') {
            console.log('[HOMEGATE] Redirecting to discover from:', loc.pathname);
            nav('/discover', { replace: true });
          }
        }
      } catch (e) {
        console.error('[HOMEGATE] Error during auth check:', {
          error: e,
          message: e?.message,
          path: loc.pathname,
          stack: e?.stack
        });
        setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [loc.pathname, nav]);

  // Always render children; show a visible loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-70">Loading…</div>
      </div>
    );
  }

  return children;
}

HomeGate.propTypes = {
  children: PropTypes.node.isRequired
};