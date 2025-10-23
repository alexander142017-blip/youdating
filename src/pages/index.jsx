import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import HomeGate from './HomeGate';
import AuthStart from './AuthStart';
import AuthCallback from './AuthCallback';
import ProtectedRoute from '../components/ProtectedRoute';
import DiscoverPage from './Discover'; // Keep eager for first-paint speed

// Route code-splitting - lazy load infrequent pages
const Onboarding = lazy(() => import('./Onboarding'));
const MatchesPage = lazy(() => import('./Matches'));
const MessagesPage = lazy(() => import('./Messages'));
const ProfilePage = lazy(() => import('./Profile'));
const EditProfile = lazy(() => import('./EditProfile'));
const StorePage = lazy(() => import('./Store'));
const LikesYou = lazy(() => import('./LikesYou'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const ForgotPassword = lazy(() => import('./auth/ForgotPassword'));
const UpdatePassword = lazy(() => import('./auth/UpdatePassword'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home gate - decides where to redirect */}
        <Route index element={<HomeGate />} />
        
        {/* Auth pages - no protection needed */}
        <Route path="auth" element={<AuthStart />} />
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="auth/forgot" element={
          <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
            <ForgotPassword />
          </Suspense>
        } />
        <Route path="auth/update-password" element={
          <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
            <UpdatePassword />
          </Suspense>
        } />
        
        {/* Lazy-loaded routes wrapped with Suspense */}
        <Route path="onboarding" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <Onboarding />
            </Suspense>
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
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <MatchesPage />
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="messages" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <MessagesPage />
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="profile" element={
          <ProtectedRoute requireOnboarding={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="profile/edit" element={
          <ProtectedRoute requireOnboarding={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <EditProfile />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="likes" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <LikesYou />
            </Suspense>
          </ProtectedRoute>
        } />
        
        <Route path="store" element={
          <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <StorePage />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="admin" element={
          <ProtectedRoute requireOnboarding={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="analytics" element={
          <ProtectedRoute requireOnboarding={true}>
            <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
              <AnalyticsDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}