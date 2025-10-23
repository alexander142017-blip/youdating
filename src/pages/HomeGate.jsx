import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../api/supabase";

export default function HomeGate() {
  // Phone verification is optional by default. Enable with VITE_REQUIRE_PHONE_VERIFICATION=1
  const phoneVerificationRequired = import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1';
  
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

  const checkUserStatus = useCallback(async () => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in → redirect to /auth
        setRedirect("/auth");
        return;
      }

      // User is logged in, check their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete, phone_verified')
        .eq('id', session.user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        // Onboarding not complete → redirect to /onboarding
        setRedirect("/onboarding");
      } else if (phoneVerificationRequired && !profile.phone_verified) {
        // Onboarded but phone not verified → redirect to /onboarding (only if phone verification required)
        setRedirect("/onboarding");
      } else {
        // Onboarding complete (and phone verified if required) → redirect to /discover
        setRedirect("/discover");
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Default to auth page on error
      setRedirect("/auth");
    }
  }, [phoneVerificationRequired]);

  // Return null while loading (minimal approach)
  if (!redirect) {
    return null;
  }

  // Navigate to determined route
  return <Navigate to={redirect} replace />;
}