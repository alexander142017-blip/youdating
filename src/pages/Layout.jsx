

import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Heart, 
  MessageCircle, 
  User, 
  Compass,
  Store as StoreIcon, 
  Menu, 
  X, 
  Bell,
  Settings
} from "lucide-react";
import { getCurrentSessionUser as getCurrentUser } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";

const navigationItems = [
  {
    title: "Discover",
    url: createPageUrl("discover"),
    icon: Compass,
    description: "Find new matches"
  },
  {
    title: "Matches",
    url: createPageUrl("matches"),
    icon: Heart,
    description: "Your matches"
  },
  {
    title: "Messages",
    url: createPageUrl("messages"),
    icon: MessageCircle,
    description: "Chat with matches"
  },
  {
    title: "Profile",
    url: createPageUrl("profile"),
    icon: User,
    description: "Edit your profile"
  },
  {
    title: "Store",
    url: createPageUrl("store"),
    icon: StoreIcon,
    description: "Premium features"
  },
];

export default function Layout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global path logging for production debugging
  useEffect(() => {
    console.log('[LAYOUT] Current route:', location.pathname, location.search);
  }, [location]);

  // We don't need to use currentUser here since HomeGate handles auth,
  // but we keep the query for potential future use
  useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActivePage = (url) => location.pathname === url;

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Navigation Header */}
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          {/* Mobile Menu Button */}
          <div className="dropdown lg:hidden">
            <div 
              tabIndex={0} 
              role="button" 
              className="btn btn-ghost btn-circle"
              onClick={toggleMobileMenu}
            >
              <div className="relative w-6 h-6">
                <Menu className={`w-6 h-6 absolute transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100'}`} />
                <X className={`w-6 h-6 absolute transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0'}`} />
              </div>
            </div>
            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
              <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-64 p-2 shadow-lg mt-3">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePage(item.url);
                  return (
                    <li key={item.title}>
                      <Link
                        to={item.url}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 ${isActive ? 'bg-primary text-primary-content' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-60">{item.description}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Logo */}
          <Link to={createPageUrl("discover")} className="btn btn-ghost text-xl">
            <Heart className="w-8 h-8 text-primary" />
            <span className="bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent font-bold">
              YouDating
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePage(item.url);
              return (
                <li key={item.title}>
                  <Link
                    to={item.url}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-ghost'} btn-sm gap-2`}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* User Actions */}
        <div className="navbar-end">
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-circle" title="Notifications">
              <Bell className="w-5 h-5" />
            </button>
            <button className="btn btn-ghost btn-circle" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="min-h-[calc(100vh-12rem)]">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="btm-nav lg:hidden">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePage(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={isActive ? 'active' : ''}
            >
              <Icon className="w-5 h-5" />
              <span className="btm-nav-label text-xs">{item.title}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Toast Notifications */}
      <Toaster richColors position="top-center" />
    </div>
  );
}

