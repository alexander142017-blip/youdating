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
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        // If not signed in → go to /auth (but don't loop if already there)
        if (!session) {
          setLoading(false);
          if (!loc.pathname.startsWith('/auth')) nav('/auth', { replace: true });
          return;
        }

        // Load current user's profile
        const uid = session.user.id;
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id,onboarding_complete')
          .eq('user_id', uid)
          .maybeSingle();
        if (cancelled) return;

        setLoading(false);

        // Route decisions (use lowercase canonical paths)
        const at = loc.pathname.toLowerCase();
        if (!prof?.onboarding_complete) {
          if (!at.startsWith('/onboarding')) nav('/onboarding', { replace: true });
        } else {
          if (at === '/' || at === '/auth') nav('/discover', { replace: true });
        }
      } catch (e) {
        console.error('gate error', e);
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