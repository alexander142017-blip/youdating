import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../api/supabase";

export default function ProtectedRoute({ children, requireOnboarding = false }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No user logged in
        setUser(null);
        setChecked(true);
        return;
      }

      // User is logged in, get their profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(session.user);
      setProfile(profileData);
      setChecked(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setChecked(true);
    }
  };

  // Don't render anything until auth is checked
  if (!checked) {
    return null;
  }

  // No user → redirect to /auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Route needs onboarding and user hasn't completed it → redirect to /onboarding
  if (requireOnboarding && profile && !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // User is authenticated and meets requirements
  return children;
}