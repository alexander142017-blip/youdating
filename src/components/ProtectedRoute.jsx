import { useState, useEffect, useCallback, useMemo } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { supabase } from "../api/supabase";

export default function ProtectedRoute({ children, requireOnboarding = false, needsVerifiedPhone = false }) {
  // Phone verification is optional by default. Enable with VITE_REQUIRE_PHONE_VERIFICATION=1
  const phoneVerificationRequired = import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1';
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No user logged in
        setUser(null);
        setProfile(null);
        setChecked(true);
        setLoading(false);
        return;
      }

      // User is logged in, get their profile with optimized query
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, onboarding_complete, phone_verified, profile_completed')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setUser(session.user);
      setProfile(profileData);
      setChecked(true);
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setProfile(null);
      setChecked(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    
    // Set up auth state change listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setChecked(true);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  // Memoize redirect logic to prevent unnecessary re-calculations
  const redirectPath = useMemo(() => {
    if (!checked || loading) return null;
    
    // No user → redirect to /auth
    if (!user) return '/auth';
    
    // Route needs onboarding and user hasn't completed it → redirect to /onboarding
    if (requireOnboarding && profile && !profile.onboarding_complete) return '/onboarding';
    
    // Route needs verified phone and user hasn't verified their phone → redirect to /onboarding
    if (needsVerifiedPhone && phoneVerificationRequired && profile && !profile.phone_verified) return '/onboarding';
    
    return null;
  }, [checked, loading, user, profile, requireOnboarding, needsVerifiedPhone, phoneVerificationRequired]);

  // Show loading state
  if (!checked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect if necessary
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and meets requirements
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requireOnboarding: PropTypes.bool,
  needsVerifiedPhone: PropTypes.bool,
};