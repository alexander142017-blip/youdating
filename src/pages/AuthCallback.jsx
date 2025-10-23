import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";

/**
 * AuthCallback Component
 * 
 * Handles the authentication callback after user clicks magic link from email.
 * This component:
 * 1. Gets the current session from Supabase
 * 2. Waits briefly to ensure session is properly established
 * 3. Redirects to home page (/) which will trigger HomeGate routing logic
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    handleAuthCallback();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthCallback = async () => {
    try {
      // Get current session after magic link authentication
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session retrieval error:", error);
        setStatus("error");
        // Redirect to auth page on error after a delay
        setTimeout(() => navigate("/auth"), 2000);
        return;
      }

      if (session && session.user) {
        console.log("Authentication successful:", session.user.email);
        setStatus("success");
        
        // Brief delay to ensure session is fully established
        // then redirect to home which will trigger HomeGate logic
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1500);
      } else {
        console.warn("No session found after callback");
        setStatus("no-session");
        // Redirect to auth page if no session
        setTimeout(() => navigate("/auth"), 2000);
      }
    } catch (error) {
      console.error("Auth callback error:", error);
      setStatus("error");
      setTimeout(() => navigate("/auth"), 2000);
    }
  };

  // Render different UI based on status
  const renderContent = () => {
    switch (status) {
      case "processing":
        return (
          <>
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <h2 className="text-xl font-semibold text-gray-800 mt-4">Signing you in...</h2>
            <p className="text-gray-600 mt-2">Please wait while we complete your authentication</p>
          </>
        );
      
      case "success":
        return (
          <>
            <div className="text-success text-4xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome back!</h2>
            <p className="text-gray-600 mt-2">Redirecting you to the app...</p>
          </>
        );
      
      case "error":
        return (
          <>
            <div className="text-error text-4xl mb-4">✕</div>
            <h2 className="text-xl font-semibold text-gray-800">Authentication Error</h2>
            <p className="text-gray-600 mt-2">Something went wrong. Redirecting to login...</p>
          </>
        );
      
      case "no-session":
        return (
          <>
            <div className="text-warning text-4xl mb-4">⚠</div>
            <h2 className="text-xl font-semibold text-gray-800">No Active Session</h2>
            <p className="text-gray-600 mt-2">Please try signing in again...</p>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {renderContent()}
      </div>
    </div>
  );
}