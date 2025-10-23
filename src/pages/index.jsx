import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import HomeGate from './HomeGate';
import AuthStart from './AuthStart';
import AuthCallback from './AuthCallback';
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
        <HomeGate>
          <Routes>
            {/* Root route wrapped in Layout */}
            <Route path="/" element={<Layout />}>
              <Route index element={<DiscoverPage />} />
              
              {/* Discover routes */}
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="Discover" element={<DiscoverPage />} />

              {/* Onboarding routes */}
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="Onboarding" element={<Onboarding />} />

              {/* Profile routes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="Profile" element={<ProfilePage />} />

              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="EditProfile" element={<EditProfile />} />

              {/* Messages routes */}
              <Route path="messages" element={<MessagesPage />} />
              <Route path="Messages" element={<MessagesPage />} />

              {/* Matches routes */}
              <Route path="matches" element={<MatchesPage />} />
              <Route path="Matches" element={<MatchesPage />} />

              {/* Store routes */}
              <Route path="store" element={<StorePage />} />
              <Route path="Store" element={<StorePage />} />

              {/* Likes You routes */}
              <Route path="likes-you" element={<LikesYou />} />
              <Route path="LikesYou" element={<LikesYou />} />

              {/* Admin routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="AdminDashboard" element={<AdminDashboard />} />

              {/* Analytics routes */}
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="AnalyticsDashboard" element={<AnalyticsDashboard />} />
            </Route>

            {/* Auth routes without Layout */}
            <Route path="auth" element={<AuthStart />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="auth/forgot" element={<ForgotPassword />} />
            <Route path="auth/update-password" element={<UpdatePassword />} />

            {/* Catch-all → redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HomeGate>
      </Suspense>
    </ErrorBoundary>
  );
}