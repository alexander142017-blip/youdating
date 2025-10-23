import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './pages';
import { supabase } from './api/supabase';

export default function App() {
  useEffect(() => {
    // Set default theme
    document.documentElement.setAttribute('data-theme', 'youdating-light');
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      const theme = e.matches ? 'youdating-dark' : 'youdating-light';
      document.documentElement.setAttribute('data-theme', theme);
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    // Set initial theme based on system preference
    handleThemeChange(mediaQuery);
    
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    // Initialize Supabase auth and set up session management
    const initializeAuth = async () => {
      try {
        console.log('🔗 Initializing Supabase authentication...');
        
        // Check if environment variables are set
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          console.warn('⚠️ Supabase environment variables not found. Please check your .env file.');
          console.log('Expected variables:');
          console.log('- VITE_SUPABASE_URL');
          console.log('- VITE_SUPABASE_ANON_KEY');
          return;
        }
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Failed to get initial session:', error.message);
        } else {
          console.log('✅ Supabase connected successfully!');
          console.log('📡 Supabase URL:', url);
          console.log('🔐 Initial session status:', session ? `Authenticated as ${session.user.email}` : 'No active session');
        }
        
      } catch (error) {
        console.error('❌ Auth initialization failed:', error.message);
      }
    };
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in:', session?.user?.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Auth token refreshed');
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery initiated');
      }
    });
    
    // Initialize auth on component mount
    initializeAuth();
    
    // Cleanup subscription on unmount
    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}