

import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Lightbulb, MessageCircle, HeartHandshake, Users, User, Sparkles, Gem, Shield, Loader2, BarChart3, Star, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { base44 } from "@/api/base44Compat";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

const navigationItems = [
  {
    title: "Discover",
    url: createPageUrl("Discover"),
    icon: Sparkles,
  },
  {
    title: "Likes You",
    url: createPageUrl("LikesYou"),
    icon: HeartHandshake,
  },
  {
    title: "Matches",
    url: createPageUrl("Matches"),
    icon: Lightbulb,
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageCircle,
  },
  {
    title: "Store",
    url: createPageUrl("Store"),
    icon: Gem,
  },
  {
    title: "Profile",
    url: createPageUrl("Profile"),
    icon: User,
  },
];

const adminNavigationItems = [
    {
        title: "Admin",
        url: createPageUrl("AdminDashboard"),
        icon: Shield,
    },
    {
        title: "Analytics",
        url: createPageUrl("AnalyticsDashboard"),
        icon: BarChart3,
    }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: currentUser, isLoading, isError } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry if user is not logged in
  });

  useEffect(() => {
    // If loading is finished and there's an error (e.g. not logged in), do nothing.
    // The page component itself (or a parent) should handle redirects to login.
    // For this app, we assume all pages are protected.
    if (!isLoading && isError && currentPageName !== 'Onboarding') {
        // In a real app with a public login page, you'd redirect here.
        // base44 handles this automatically.
        return;
    }

    if (!isLoading && currentUser && !currentUser.profile_completed && currentPageName !== 'Onboarding') {
        navigate(createPageUrl('Onboarding'));
    }
  }, [currentUser, isLoading, isError, currentPageName, navigate]);

  if (isLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-rose-500 animate-spin"/>
          </div>
      )
  }

  // If user is not authenticated, don't render layout.
  // The app's auth boundary will handle redirecting to a login page.
  if (!currentUser) return children;

  // If user is not finished onboarding, only show onboarding page without the main layout
  if (!currentUser.profile_completed) {
      return children;
  }

  const isAdmin = currentUser?.role === 'admin';
  const navItems = isAdmin ? [...navigationItems, ...adminNavigationItems] : navigationItems;

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 346.8 77.2% 49.8%;
          --primary-foreground: 355.7 100% 97.3%;
          --accent: 346.8 77.2% 49.8%;
          --background: 0 0% 98%;
        }
        .dark {
          --primary: 346.8 77.2% 49.8%;
          --primary-foreground: 355.7 100% 97.3%;
          --accent: 346.8 77.2% 49.8%;
          --background: 240 10% 3.9%;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 hidden md:flex">
          <SidebarHeader className="border-b border-gray-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                  YouDating
                </h2>
                <p className="text-xs text-gray-500">Find your match</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-rose-100 hover:text-rose-700 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 hover:text-white shadow-md'
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-100 p-4 space-y-2">
             <Link to={createPageUrl("Store")}>
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">Super Likes</span>
                         <Star className="w-5 h-5 text-blue-400"/>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {currentUser?.super_likes_remaining || 0}
                    </div>
                </div>
             </Link>
             <Link to={createPageUrl("Store")}>
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">Boosts</span>
                         <Zap className="w-5 h-5 text-purple-400"/>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                        {currentUser?.boosts_remaining || 0}
                    </div>
                </div>
             </Link>
          </SidebarFooter>

        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 md:hidden sticky top-0 z-50">
            <div className="flex items-center justify-between">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                  YouDating
                </h1>
              </div>
              <div className="w-10" />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
          <Toaster richColors position="top-center" />

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden bg-white border-t border-gray-100 sticky bottom-0">
            <div className="flex justify-around items-center py-2">
              {navItems.slice(0, 5).map((item) => ( // Show first 5 items on mobile nav
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all duration-200 ${
                    location.pathname === item.url
                      ? 'text-rose-600'
                      : 'text-gray-500 hover:text-rose-500'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${location.pathname === item.url ? 'fill-rose-200' : ''}`} />
                  <span className="text-xs font-medium">{item.title}</span>
                </Link>
              ))}
            </div>
          </nav>
        </main>
      </div>
    </SidebarProvider>
  );
}

