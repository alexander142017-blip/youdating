import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import HomeGate from './HomeGate';
import AuthStart from './AuthStart';
import AuthCallback from './AuthCallback';
import ProtectedRoute from '../components/ProtectedRoute';
import ErrorBoundary from '../components/core/ErrorBoundary';
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
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 text-center text-sm opacity-70">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Home gate - decides where to redirect */}
            <Route index element={<HomeGate />} />
            
            {/* Auth pages - no protection needed */}
            <Route path="auth" element={<AuthStart />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="auth/forgot" element={<ForgotPassword />} />
            <Route path="auth/update-password" element={<UpdatePassword />} />
            
            {/* Onboarding (with capitalized alias) */}
            <Route path="onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route path="Onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            {/* Discover - main app entry point */}
            <Route path="discover" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <DiscoverPage />
              </ProtectedRoute>
            } />
            <Route path="Discover" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <DiscoverPage />
              </ProtectedRoute>
            } />
            
            {/* Profile routes with aliases */}
            <Route path="profile" element={
              <ProtectedRoute requireOnboarding={true}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="Profile" element={
              <ProtectedRoute requireOnboarding={true}>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="edit-profile" element={
              <ProtectedRoute requireOnboarding={true}>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="profile/edit" element={
              <ProtectedRoute requireOnboarding={true}>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="EditProfile" element={
              <ProtectedRoute requireOnboarding={true}>
                <EditProfile />
              </ProtectedRoute>
            } />
            
            {/* Matches with aliases */}
            <Route path="matches" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <MatchesPage />
              </ProtectedRoute>
            } />
            <Route path="Matches" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <MatchesPage />
              </ProtectedRoute>
            } />
            
            {/* Messages with aliases */}
            <Route path="messages" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <MessagesPage />
              </ProtectedRoute>
            } />
            <Route path="Messages" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <MessagesPage />
              </ProtectedRoute>
            } />
            
            {/* Store with aliases */}
            <Route path="store" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <StorePage />
              </ProtectedRoute>
            } />
            <Route path="Store" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <StorePage />
              </ProtectedRoute>
            } />

            {/* Likes You with aliases */}
            <Route path="likes-you" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <LikesYou />
              </ProtectedRoute>
            } />
            <Route path="likes" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <LikesYou />
              </ProtectedRoute>
            } />
            <Route path="LikesYou" element={
              <ProtectedRoute requireOnboarding={true} needsVerifiedPhone={true}>
                <LikesYou />
              </ProtectedRoute>
            } />

            {/* Admin with aliases */}
            <Route path="admin" element={
              <ProtectedRoute requireOnboarding={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="AdminDashboard" element={
              <ProtectedRoute requireOnboarding={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Analytics with aliases */}
            <Route path="analytics" element={
              <ProtectedRoute requireOnboarding={true}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            <Route path="AnalyticsDashboard" element={
              <ProtectedRoute requireOnboarding={true}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />

            {/* 404 → home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}