import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getCurrentUser } from '../api/auth';
import { upsertProfile, fetchMyProfile } from '../api/profiles';

/**
 * Ensure a profile exists for the authenticated user
 * @param {Object} session - Supabase session object
 * @returns {Object} - Profile data (existing or newly created)
 */
async function ensureProfile(user) {
  const user_id = user.id;
  const email = user.email ?? null;
  
  try {
    console.log('[HOMEGATE] Checking for existing profile for user:', user_id);
    
    const existing = await fetchMyProfile(user_id);
    
    if (existing) {
      console.log('[HOMEGATE] Found existing profile:', existing);
      return existing;
    }

    console.log('[HOMEGATE] No profile found, creating minimal profile for user:', user_id);
    
    const inserted = await upsertProfile({
      user_id,
      email,
      onboarding_complete: false,
      full_name: user.user_metadata?.full_name || null,
      photos: []
    });
    
    console.log('[HOMEGATE] Created new profile:', inserted);
    return inserted;
  } catch (error) {
    console.error('[PROFILE ERROR]', error?.message || error);
    throw error;
  }
}

export default function HomeGate({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        console.log('[HOMEGATE] Starting auth check at path:', loc.pathname);
        
        const user = await getCurrentUser();
        if (!active) return;
        
        console.log('[HOMEGATE] Auth check result:', user ? 'authenticated' : 'not authenticated');

        // If not signed in → go to /auth (but don't loop if already there)
        if (!user) {
          console.log('[HOMEGATE] No user, redirecting to auth if needed');
          setLoading(false);
          if (!loc.pathname.startsWith('/auth')) {
            console.log('[HOMEGATE] Redirecting to /auth from:', loc.pathname);
            nav('/auth', { replace: true });
          }
          return;
        }

        // Ensure profile exists for authenticated user
        console.log('[HOMEGATE] User authenticated, ensuring profile exists');
        const prof = await ensureProfile(user);
        
        console.log('[HOMEGATE] Profile ensured:', prof);
        if (!active) return;

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
    return () => { active = false; };
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