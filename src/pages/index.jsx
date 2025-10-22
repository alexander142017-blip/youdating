import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import DiscoverPage from './Discover';
import MatchesPage from './Matches';
import MessagesPage from './Messages';
import ProfilePage from './Profile';
import StorePage from './Store';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DiscoverPage />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="store" element={<StorePage />} />
      </Route>
    </Routes>
  );
}