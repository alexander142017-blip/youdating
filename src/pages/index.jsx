import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomeGate from './HomeGate';
import Auth from './Auth';
import Onboarding from './Onboarding';
import ProtectedRoute from '../components/ProtectedRoute';
import DiscoverPage from './Discover';
import MatchesPage from './Matches';
import MessagesPage from './Messages';
import ProfilePage from './Profile';
import StorePage from './Store';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home gate - decides where to redirect */}
        <Route index element={<HomeGate />} />
        
        {/* Auth page - no protection needed */}
        <Route path="auth" element={<Auth />} />
        
        {/* Onboarding - requires login only */}
        <Route path="onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Main app routes - require login, completed onboarding, AND verified phone */}
        <Route path="discover" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <DiscoverPage />
          </ProtectedRoute>
        } />
        
        <Route path="matches" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <MatchesPage />
          </ProtectedRoute>
        } />
        
        <Route path="messages" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <MessagesPage />
          </ProtectedRoute>
        } />
        
        <Route path="profile" element={
          <ProtectedRoute requireOnboarding={true}>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        <Route path="store" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <StorePage />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}