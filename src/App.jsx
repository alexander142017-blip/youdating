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
    // Test Supabase connection on app start
    const testConnection = async () => {
      try {
        console.log('🔗 Testing Supabase connection...');
        
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
        
        // Test connection with a simple query
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Supabase connection failed:', error.message);
        } else {
          console.log('✅ Supabase connected successfully!');
          console.log('📡 Supabase URL:', url);
          console.log('🔐 Session status:', data.session ? 'Authenticated' : 'No active session');
        }
      } catch (error) {
        console.error('❌ Supabase connection test failed:', error.message);
      }
    };
    
    testConnection();
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}