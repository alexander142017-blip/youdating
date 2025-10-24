import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import HomeGate from './HomeGate';
import AuthStart from './AuthStart';
import AuthCallback from './AuthCallback';
import ErrorBoundary from '../components/core/ErrorBoundary';
import DiscoverPage from './Discover'; // Keep eager for first-paint speed
import Debug from './Debug'; // Debug route for router verification

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
        <HomeGate>
          <Routes>
            {/* Root route wrapped in Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={
                <ErrorBoundary>
                  <DiscoverPage />
                </ErrorBoundary>
              } />
              
              {/* Discover routes */}
              <Route path="discover" element={
                <ErrorBoundary>
                  <DiscoverPage />
                </ErrorBoundary>
              } />
              <Route path="Discover" element={
                <ErrorBoundary>
                  <DiscoverPage />
                </ErrorBoundary>
              } />

              {/* Onboarding routes */}
              <Route path="onboarding" element={
                <ErrorBoundary>
                  <Onboarding />
                </ErrorBoundary>
              } />
              <Route path="Onboarding" element={
                <ErrorBoundary>
                  <Onboarding />
                </ErrorBoundary>
              } />

              {/* Profile routes */}
              <Route path="profile" element={
                <ErrorBoundary>
                  <ProfilePage />
                </ErrorBoundary>
              } />
              <Route path="Profile" element={
                <ErrorBoundary>
                  <ProfilePage />
                </ErrorBoundary>
              } />

              <Route path="edit-profile" element={
                <ErrorBoundary>
                  <EditProfile />
                </ErrorBoundary>
              } />
              <Route path="EditProfile" element={
                <ErrorBoundary>
                  <EditProfile />
                </ErrorBoundary>
              } />

              {/* Messages routes */}
              <Route path="messages" element={
                <ErrorBoundary>
                  <MessagesPage />
                </ErrorBoundary>
              } />
              <Route path="Messages" element={
                <ErrorBoundary>
                  <MessagesPage />
                </ErrorBoundary>
              } />

              {/* Matches routes */}
              <Route path="matches" element={
                <ErrorBoundary>
                  <MatchesPage />
                </ErrorBoundary>
              } />
              <Route path="Matches" element={
                <ErrorBoundary>
                  <MatchesPage />
                </ErrorBoundary>
              } />

              {/* Store routes */}
              <Route path="store" element={
                <ErrorBoundary>
                  <StorePage />
                </ErrorBoundary>
              } />
              <Route path="Store" element={
                <ErrorBoundary>
                  <StorePage />
                </ErrorBoundary>
              } />

              {/* Likes You routes */}
              <Route path="likes-you" element={
                <ErrorBoundary>
                  <LikesYou />
                </ErrorBoundary>
              } />
              <Route path="LikesYou" element={
                <ErrorBoundary>
                  <LikesYou />
                </ErrorBoundary>
              } />

              {/* Admin routes */}
              <Route path="admin" element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              } />
              <Route path="AdminDashboard" element={
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              } />

              {/* Analytics routes */}
              <Route path="analytics" element={
                <ErrorBoundary>
                  <AnalyticsDashboard />
                </ErrorBoundary>
              } />
              <Route path="AnalyticsDashboard" element={
                <ErrorBoundary>
                  <AnalyticsDashboard />
                </ErrorBoundary>
              } />
            </Route>

            {/* Auth routes without Layout */}
            <Route path="auth" element={<AuthStart />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="auth/forgot" element={<ForgotPassword />} />
            <Route path="auth/update-password" element={<UpdatePassword />} />

            {/* Debug route for router verification */}
            <Route path="debug" element={<Debug />} />

            {/* Catch-all → redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HomeGate>
      </Suspense>
    </ErrorBoundary>
  );
}