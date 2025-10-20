
import React, { useState, useEffect } from "react";
import { getCurrentUser, updateCurrentUser, logout } from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, LogOut, Shield, Bell, Eye, Trash2, Edit, ChevronRight, Paintbrush, FileText, Gem, Settings, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BlockedUsersModal from "../components/profile/BlockedUsersModal";
import AboutModal from "../components/profile/AboutModal";
import LegalModal from "../components/profile/LegalModal";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SettingsSection = ({ id, icon, title, description, children }) => {
    const Icon = icon;
    return (
        <Card id={id} className="scroll-mt-20">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-600"/>
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    );
}

const SettingsLink = ({ href, icon, title, description, isPageLink = false, onClick }) => {
    const Icon = icon;
    const navigate = useNavigate();

    const handleClick = (e) => {
        if (isPageLink) {
            e.preventDefault();
            navigate(href);
        } else if (onClick) {
            e.preventDefault(); // Prevent default anchor behavior if onClick is present
            onClick(e);
        } else {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
    
    return (
        <a href={href} onClick={handleClick} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
        </a>
    )
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isBlockedUsersModalOpen, setIsBlockedUsersModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    discovery_show_me: "everyone",
    discovery_max_distance: 50,
    discovery_age_min: 18,
    discovery_age_max: 55,
    discovery_show_on_discover: true,
    discovery_global_mode: false,

    notifications_new_matches: true,
    notifications_new_messages: true,
    notifications_likes: true,
    notifications_promotions: true,
    
    privacy_hide_age: false,
    privacy_hide_distance: false,
    privacy_read_receipts: true,
    
    app_theme: "auto",
    app_units: "miles",
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        setFormData({
          discovery_show_me: user.discovery_show_me || "everyone",
          discovery_max_distance: user.discovery_max_distance || 50,
          discovery_age_min: user.discovery_age_min || 18,
          discovery_age_max: user.discovery_age_max || 55,
          discovery_show_on_discover: user.discovery_show_on_discover !== false,
          discovery_global_mode: user.discovery_global_mode === true,

          notifications_new_matches: user.notifications_new_matches !== false,
          notifications_new_messages: user.notifications_new_messages !== false,
          notifications_likes: user.notifications_likes !== false,
          notifications_promotions: user.notifications_promotions !== false,

          privacy_hide_age: user.privacy_hide_age === true,
          privacy_hide_distance: user.privacy_hide_distance === true,
          privacy_read_receipts: user.privacy_read_receipts !== false,
          
          app_theme: user.app_theme || "auto",
          app_units: user.app_units || "miles",
        });
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateCurrentUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['current-user'], (old) => ({...old, ...updatedUser}));
      setCurrentUser(prev => ({...prev, ...updatedUser}));
      toast.success("Settings saved successfully!");
    },
    onError: () => {
        toast.error("Failed to save settings. Please try again.");
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    await updateProfileMutation.mutateAsync({
      ...formData
    });
  };

  const handleLogout = () => {
    logout();
  };
  
  const handleRestorePurchases = () => {
      // In a real app, you'd call the native "restore" function for IAP.
      // Here, we invalidate the query to re-fetch the user's latest status.
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      // A small delay to allow the query to potentially update, then check
      setTimeout(() => {
          // Re-fetch current user to get the most updated premium status
          const updatedUser = queryClient.getQueryData(['current-user']);
          if (updatedUser?.isPremium && new Date(updatedUser?.premiumExpiresAt) > new Date()) {
              toast.success("Purchases restored!", { description: "Your premium status is active." });
          } else {
              toast.info("No active subscriptions found.", { description: "If you believe this is an error, please contact support." });
          }
      }, 500); // Adjust delay as needed
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const isPremium = currentUser?.isPremium && new Date(currentUser?.premiumExpiresAt) > new Date();

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center">
             <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
                <Settings /> Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your profile and app preferences</p>
        </div>
        
        <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-2">
                 <SettingsLink href={createPageUrl("EditProfile")} icon={Edit} title="Edit Profile" description="Photos, bio, etc." isPageLink />
                 <SettingsLink href="#discovery" icon={Heart} title="Discovery" description="Set your preferences"/>
                 <SettingsLink href="#account" icon={Shield} title="Account" description="Security and actions"/>
                 <SettingsLink href="#privacy" icon={Eye} title="Privacy & Safety" description="Control your info"/>
                 <SettingsLink href="#notifications" icon={Bell} title="Notifications" description="Choose your alerts"/>
                 <SettingsLink href="#premium" icon={Gem} title="Subscription" description="Manage premium"/>
                 <SettingsLink href="#app-preferences" icon={Paintbrush} title="App Preferences" description="Customize your UI"/>
                 <SettingsLink href="#legal" icon={FileText} title="About & Legal" description="Policies and contact"/>
            </CardContent>
        </Card>
        
        <SettingsSection id="discovery" icon={Heart} title="Discovery Preferences" description="Set your preferences for who you see">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Show me</Label>
                    <Select value={formData.discovery_show_me} onValueChange={(v) => handleInputChange('discovery_show_me', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Men</SelectItem>
                            <SelectItem value="female">Women</SelectItem>
                            <SelectItem value="everyone">Everyone</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Maximum distance</Label>
                        <span className="font-medium">{formData.discovery_max_distance} {formData.app_units}</span>
                    </div>
                    <Slider
                        value={[formData.discovery_max_distance]}
                        onValueChange={([v]) => handleInputChange('discovery_max_distance', v)}
                        max={100}
                        step={1}
                    />
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Age range</Label>
                        <span className="font-medium">{formData.discovery_age_min} - {formData.discovery_age_max}</span>
                    </div>
                     <Slider
                        value={[formData.discovery_age_min, formData.discovery_age_max]}
                        onValueChange={([min, max]) => {
                            handleInputChange('discovery_age_min', min);
                            handleInputChange('discovery_age_max', max);
                        }}
                        min={18}
                        max={80}
                        step={1}
                    />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                        <Label htmlFor="show_on_discover">Show me on Discover</Label>
                        <p className="text-xs text-gray-500">Temporarily hide your profile from the Discover feed.</p>
                    </div>
                    <Switch
                      id="show_on_discover"
                      checked={formData.discovery_show_on_discover}
                      onCheckedChange={(v) => handleInputChange('discovery_show_on_discover', v)}
                    />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                        <Label htmlFor="global_mode">Global Mode</Label>
                        <p className="text-xs text-gray-500">See users from around the world.</p>
                    </div>
                    <Switch
                      id="global_mode"
                      checked={formData.discovery_global_mode}
                      onCheckedChange={(v) => handleInputChange('discovery_global_mode', v)}
                    />
                </div>
            </div>
        </SettingsSection>

        <SettingsSection id="account" icon={Shield} title="Account" description="Manage account security and actions">
             <div className="space-y-4">
                 <Button variant="outline" className="w-full justify-between" onClick={handleRestorePurchases}>
                    <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2"/>
                        Restore Purchases
                    </div>
                    <ChevronRight/>
                 </Button>
                 <Button variant="outline" className="w-full justify-between" disabled>Change Email or Phone <ChevronRight/></Button>
                 <Button variant="outline" className="w-full justify-between" disabled>Change Password <ChevronRight/></Button>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="two-step">Two-step verification</Label>
                    <Switch id="two-step" disabled/>
                 </div>
                 <Button variant="outline" className="w-full justify-between" onClick={handleLogout}>Logout</Button>
                 <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                    <h4 className="font-semibold text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-700 mt-1 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                     <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive">Delete Account</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account, matches, messages, and photos. This data cannot be recovered.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => toast.info("Account deletion is a backend process and has not been implemented in this demo.")}>
                            I Understand, Delete My Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </SettingsSection>
        
        <SettingsSection id="privacy" icon={Eye} title="Privacy & Safety" description="Control who sees your information">
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="hide_age">Hide my age</Label>
                    <Switch
                        id="hide_age"
                        checked={formData.privacy_hide_age}
                        onCheckedChange={(v) => handleInputChange('privacy_hide_age', v)}
                    />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="hide_distance">Hide my distance</Label>
                    <Switch
                        id="hide_distance"
                        checked={formData.privacy_hide_distance}
                        onCheckedChange={(v) => handleInputChange('privacy_hide_distance', v)}
                    />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="read_receipts">Share read receipts</Label>
                        {!isPremium && <Badge variant="secondary" className="bg-amber-100 text-amber-800">Plus</Badge>}
                    </div>
                    <Switch
                        id="read_receipts"
                        checked={isPremium ? formData.privacy_read_receipts : false}
                        onCheckedChange={(v) => handleInputChange('privacy_read_receipts', v)}
                        disabled={!isPremium}
                    />
                </div>
                <Button variant="outline" className="w-full justify-between" onClick={() => setIsBlockedUsersModalOpen(true)}>
                    Blocked Users
                    <ChevronRight/>
                </Button>
            </div>
        </SettingsSection>
        
        <SettingsSection id="notifications" icon={Bell} title="Notifications" description="Choose which alerts you receive">
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="notif_matches">New matches</Label>
                    <Switch id="notif_matches" checked={formData.notifications_new_matches} onCheckedChange={(v) => handleInputChange('notifications_new_matches', v)} />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="notif_messages">New messages</Label>
                    <Switch id="notif_messages" checked={formData.notifications_new_messages} onCheckedChange={(v) => handleInputChange('notifications_new_messages', v)} />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="notif_likes">Likes / Super Likes</Label>
                    <Switch id="notif_likes" checked={formData.notifications_likes} onCheckedChange={(v) => handleInputChange('notifications_likes', v)} />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="notif_promos">Promotions & announcements</Label>
                    <Switch id="notif_promos" checked={formData.notifications_promotions} onCheckedChange={(v) => handleInputChange('notifications_promotions', v)} />
                </div>
            </div>
        </SettingsSection>

        <SettingsSection id="app-preferences" icon={Paintbrush} title="App Preferences" description="Customize your app experience">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={formData.app_theme} onValueChange={(v) => handleInputChange('app_theme', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="auto">System Default</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Units</Label>
                    <Select value={formData.app_units} onValueChange={(v) => handleInputChange('app_units', v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="miles">Miles</SelectItem>
                            <SelectItem value="kilometers">Kilometers</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </SettingsSection>

        <SettingsSection id="premium" icon={Gem} title="Subscription" description="Manage your YouDating premium subscription">
            {isPremium ? (
                 <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <h4 className="font-semibold text-green-800">You are a YouDating Plus Member!</h4>
                    <p className="text-sm text-green-700">Your plan expires on {new Date(currentUser.premiumExpiresAt).toLocaleDateString()}.</p>
                    <Button variant="link" className="mt-2" onClick={() => toast.info("This would open the native subscription management screen.")}>Manage Subscription</Button>
                 </div>
            ) : (
                <Card className="bg-gradient-to-br from-rose-50 to-amber-50 border-amber-100 p-6 text-center">
                    <CardTitle className="mb-2">Go Premium</CardTitle>
                    <CardDescription className="mb-4">Unlock unlimited likes, weekly boosts, and see who likes you!</CardDescription>
                    <Button onClick={() => navigate(createPageUrl("Store"))} className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">Upgrade to Plus</Button>
                </Card>
            )}
        </SettingsSection>

        <SettingsSection id="legal" icon={FileText} title="About & Legal" description="Terms of Service, Privacy Policy, and support">
            <div className="space-y-3">
                <Button variant="outline" className="w-full justify-between" onClick={() => setIsAboutModalOpen(true)}>About YouDating <ChevronRight/></Button>
                <Button variant="outline" className="w-full justify-between" onClick={() => setIsLegalModalOpen(true)}>Legal Center <ChevronRight/></Button>
            </div>
        </SettingsSection>

        <Button
          onClick={handleSaveSettings}
          disabled={updateProfileMutation.isPending}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-lg py-6"
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
      
      <BlockedUsersModal
        isOpen={isBlockedUsersModalOpen}
        onClose={() => setIsBlockedUsersModalOpen(false)}
        currentUser={currentUser}
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </div>
  );
}
