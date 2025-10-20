import Layout from "./Layout.jsx";

import Discover from "./Discover";

import Matches from "./Matches";

import Messages from "./Messages";

import Profile from "./Profile";

import Store from "./Store";

import EditProfile from "./EditProfile";

import AdminDashboard from "./AdminDashboard";

import Onboarding from "./Onboarding";

import AnalyticsDashboard from "./AnalyticsDashboard";

import LikesYou from "./LikesYou";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Discover: Discover,
    
    Matches: Matches,
    
    Messages: Messages,
    
    Profile: Profile,
    
    Store: Store,
    
    EditProfile: EditProfile,
    
    AdminDashboard: AdminDashboard,
    
    Onboarding: Onboarding,
    
    AnalyticsDashboard: AnalyticsDashboard,
    
    LikesYou: LikesYou,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Discover />} />
                
                
                <Route path="/Discover" element={<Discover />} />
                
                <Route path="/Matches" element={<Matches />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Store" element={<Store />} />
                
                <Route path="/EditProfile" element={<EditProfile />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/Onboarding" element={<Onboarding />} />
                
                <Route path="/AnalyticsDashboard" element={<AnalyticsDashboard />} />
                
                <Route path="/LikesYou" element={<LikesYou />} />

                + <Route path="/debug" element={<DebugPing />} />

                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}