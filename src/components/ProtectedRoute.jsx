import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Heart } from "lucide-react";
import { supabase } from "@/api/supabase";
import { getCurrentUser } from "@/api/auth";
import { createPageUrl } from "@/utils";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAuthChecked(true);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user has an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      if (!session) {
        // No active session
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      // User has session, load their profile
      await loadUserProfile();
      
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
      setAuthChecked(true);
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Get current user with profile data
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        // Auth user exists but no profile data
        setUser(null);
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setAuthChecked(true);
      setLoading(false);
      
    } catch (error) {
      console.error("Profile loading error:", error);
      
      // If profile loading fails, check if it's just missing profile data
      // vs auth failure
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is authenticated but profile might not exist yet
        setUser({ 
          ...session.user, 
          profile_completed: false,
          onboarding_complete: false 
        });
      } else {
        setUser(null);
      }
      
      setAuthChecked(true);
      setLoading(false);
    }
  };

  // Show loading spinner while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="avatar placeholder mb-4">
            <div className="bg-primary text-primary-content rounded-full w-16">
              <Heart className="w-8 h-8" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading YouDating...</span>
          </div>
          <p className="text-sm text-base-content/60">
            Checking authentication status
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!user) {
    return (
      <Navigate 
        to={createPageUrl("auth")} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // User is authenticated but hasn't completed onboarding
  if (user && (!user.profile_completed || !user.onboarding_complete)) {
    // Don't redirect if already on onboarding page
    if (location.pathname !== createPageUrl("onboarding")) {
      return (
        <Navigate 
          to={createPageUrl("onboarding")} 
          state={{ from: location.pathname }} 
          replace 
        />
      );
    }
  }

  // User is fully authenticated and onboarded
  return children;
}

// Higher-order component version for easier use
export function withProtection(Component) {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for accessing protected user data in components
export function useProtectedUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading protected user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          loadUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}