
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, X, MapPin, Sparkles, ChevronLeft, ChevronRight, Star, Zap, Rewind } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VerificationBadge from "../components/profile/VerificationBadge";
import BlockAndReport from "../components/shared/BlockAndReport";
import { differenceInYears, format, add, formatDistanceToNow } from 'date-fns';
import { toast } from "sonner";
import PaywallModal from "../components/shared/PaywallModal";

function calculateAge(dob) {
  if (!dob) return '';
  try {
    return differenceInYears(new Date(), new Date(dob));
  } catch (e) {
    return '';
  }
}

// Haversine formula for distance calculation
function getDistance(lat1, lon1, lat2, lon2, units = 'miles') {
    if (!lat1 || !lon1 || !lat2 || !lon2 || isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return Infinity;
    const R = units === 'miles' ? 3959 : 6371; // Radius of the Earth in miles or km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lat2 - lon1) * Math.PI / 180; // Corrected: dLon should use lon2 - lon1
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const trackEvent = (userEmail, eventType, context = {}) => {
    base44.entities.AnalyticsEvents.create({
        user_email: userEmail,
        type: eventType,
        context,
        day: format(new Date(), 'yyyy-MM-dd')
    });
};

export default function DiscoverPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showMatch, setShowMatch] = useState(null); // Changed to store user object or null
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lastSwipedProfileId, setLastSwipedProfileId] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState('');

  const { data: currentUser, refetch: refetchCurrentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    onSuccess: (user) => {
      if (!user.profile_completed) {
        navigate(createPageUrl("Onboarding"));
      }
      // Check for expired boost
      if (user.boost_expires_at && new Date(user.boost_expires_at) < new Date()) {
        updateUserMutation.mutate({ boost_expires_at: null });
      }
    },
    // Keep initialData to ensure currentUser is not undefined during initial render
    initialData: null, 
  });
  
  const { data: configData, isLoading: isLoadingConfig } = useQuery({
      queryKey: ['app-config'],
      queryFn: () => base44.entities.Config.list(),
  });

  const config = useMemo(() => {
    if (!configData) return {};
    return configData.reduce((acc, item) => {
        const key = item.key.replace(/\./g, '_');
        acc[key] = item.value.val;
        return acc;
    }, {});
  }, [configData]);

  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: myLikes, isLoading: isLoadingLikes } = useQuery({
    queryKey: ['my-likes', currentUser?.email],
    queryFn: () => base44.entities.Like.filter({ from_email: currentUser?.email }),
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: existingMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['my-matches'],
    queryFn: () => base44.entities.Match.filter({
      is_mutual: true, // Only mutual matches
      $or: [
        { user1_email: currentUser?.email },
        { user2_email: currentUser?.email }
      ]
    }),
    enabled: !!currentUser,
    initialData: [],
  });
  
  const { data: blocks } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => base44.entities.Block.list(),
    enabled: !!currentUser,
    initialData: [],
  });

  const sendEmailMutation = useMutation({
    mutationFn: (emailData) => base44.integrations.Core.SendEmail(emailData),
    onError: (error) => {
      // Log error but don't block the user experience
      console.error("Failed to send notification email:", error);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      refetchCurrentUser();
    },
    onError: (error) => {
      toast.error("Failed to update user profile.", { description: error.message || "Please try again." });
    },
  });
  
  const likeMutation = useMutation({
    mutationFn: (data) => base44.entities.Like.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-likes'] });
    },
    onError: (error) => {
      toast.error("Failed to process your interaction.", { description: error.message || "Please try again." });
      console.error("Like mutation failed:", error);
    },
  });

  const matchMutation = useMutation({
    mutationFn: (data) => base44.entities.Match.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
    },
    onError: (error) => {
      toast.error("Failed to create match.", { description: error.message || "Please try again." });
      console.error("Match mutation failed:", error);
    },
  });

  const potentialMatches = useMemo(() => {
    if (!currentUser || !allUsers.length || isLoadingLikes || isLoadingMatches || !blocks) return [];

    const profilesCurrentUserActedOn = new Set(myLikes.map(like => like.to_email));
    const matchedUserEmails = new Set(
        existingMatches.flatMap(match => [match.user1_email, match.user2_email])
    );
    const blockedByCurrentUser = new Set(blocks.filter(b => b.blocker_email === currentUser.email).map(b => b.blocked_email));
    const currentUserIsBlockedBy = new Set(blocks.filter(b => b.blocked_email === currentUser.email).map(b => b.blocker_email));
    
    // 1. Filtering
    const filteredUsers = allUsers.filter(user => {
        if (user.email === currentUser.email) return false;
        if (!user.profile_completed || user.discovery_show_on_discover === false || user.is_suspended) return false; // <-- Added is_suspended check
        if (profilesCurrentUserActedOn.has(user.email)) return false;
        if (matchedUserEmails.has(user.email)) return false; 
        if (blockedByCurrentUser.has(user.email) || currentUserIsBlockedBy.has(user.email)) return false;

        const age = calculateAge(user.date_of_birth);
        if (age < currentUser.discovery_age_min || age > currentUser.discovery_age_max) return false;

        if (currentUser.looking_for !== 'everyone' && user.gender !== currentUser.looking_for) return false;
        
        const distance = currentUser.discovery_global_mode ? 0 : getDistance(
            currentUser.latitude, currentUser.longitude, 
            user.latitude, user.longitude, 
            currentUser.app_units
        );
        
        if (!currentUser.discovery_global_mode && (distance === Infinity || distance > currentUser.discovery_max_distance)) return false;
        
        return true;
    });

    // 2. Ranking
    return filteredUsers.map(user => {
        let score = 0;
        
        // Recency score (up to 20 points)
        const lastActive = new Date(user.updated_date);
        const hoursAgo = (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 20 - hoursAgo / 12); // score decreases over 10 days for example

        // Profile score (up to 30 points based on completeness)
        if (user.bio?.length > 50) score += 10;
        score += Math.min(12, (user.photos?.length || 0) * 2); // max 6 photos = 12 points
        score += Math.min(8, (user.interests?.length || 0)); // max 8 interests = 8 points
        
        // Verified bonus (15 points)
        if (user.is_verified) score += 15;

        // Boost bonus (1000 points to put them at the top)
        const isBoosted = user.boost_expires_at && new Date(user.boost_expires_at) > new Date();
        if (isBoosted) score += 1000;

        return { ...user, score };
    }).sort((a, b) => b.score - a.score);

  }, [allUsers, myLikes, existingMatches, currentUser, blocks, isLoadingLikes, isLoadingMatches]);

  const currentProfile = potentialMatches[currentUserIndex];
  
  const isPremium = currentUser?.is_premium && new Date(currentUser?.premium_expires_at) > new Date();

  const handleInteraction = async (liked, isSuperLike = false) => {
    if (!currentProfile || !currentUser) return;
    
    // Daily like limit for free users
    if (liked && !isPremium) {
        const todayLikes = myLikes.filter(l => l.is_like && new Date(l.created_date).toDateString() === new Date().toDateString()).length;
        const dailyLikeLimit = config.limits_dailyLikes || 50;
        if (todayLikes >= dailyLikeLimit) {
            trackEvent(currentUser.email, 'rateLimited', { feature: 'likes' });
            toast.error("Daily like limit reached", { description: "Upgrade to Plus for unlimited likes." });
            setShowPaywall(true);
            return;
        }
    }

    const eventType = isSuperLike ? 'superLikeSent' : (liked ? 'likeSent' : 'passSent');
    trackEvent(currentUser.email, eventType, { targetId: currentProfile.id });

    if (isSuperLike) {
      if (!isPremium && (currentUser.super_likes_remaining || 0) <= 0) {
        trackEvent(currentUser.email, 'paywallViewed', { feature: 'superLike' });
        toast.error("Out of Super Likes", { description: "Purchase more in the store or upgrade to Plus for daily Super Likes." });
        setShowPaywall(true);
        return;
      }
      // Decrement super like (applies to both free/daily and purchased/remaining)
      updateUserMutation.mutate({ super_likes_remaining: (currentUser.super_likes_remaining || 0) - 1 });
      trackEvent(currentUser.email, 'superLikeSent', { targetId: currentProfile.id });
    }
    
    const actionText = isSuperLike ? "Super Liked" : (liked ? "Liked" : "Passed on");
    if (liked) {
      toast.success(`${actionText} ${currentProfile.full_name}`);
    } else {
      toast(`${actionText} ${currentProfile.full_name}`);
    }

    setDirection(liked ? (isSuperLike ? 2 : 1) : -1);
    setLastSwipedProfileId(currentProfile.id); // Save last swiped profile for rewind

    // Create a new Like record for this interaction
    await likeMutation.mutateAsync({
      from_email: currentUser.email,
      to_email: currentProfile.email,
      is_like: liked,
      type: isSuperLike ? 'super' : 'normal',
    });

    // If it was a like, check for a mutual match
    if (liked) {
      // Check if the other person has already liked us
      const theyLikedUs = await base44.entities.Like.filter({
        from_email: currentProfile.email,
        to_email: currentUser.email,
        is_like: true,
      });

      if (theyLikedUs.length > 0) {
        // It's a match!
        trackEvent(currentUser.email, 'matchCreated', { matchWith: currentProfile.email });
        trackEvent(currentProfile.email, 'matchCreated', { matchWith: currentUser.email });

        const isSuperMatch = isSuperLike || theyLikedUs[0].type === 'super';

        await matchMutation.mutateAsync({
            user1_email: currentUser.email,
            user2_email: currentProfile.email,
            is_mutual: true,
            is_super_like: isSuperMatch
        });
        
        setShowMatch(currentProfile); // Pass the matched user's profile to the state
        toast.success(`It's a Match with ${currentProfile.full_name}!`);

        // Send a match notification email to both users if enabled
        const emailToUs = {
          to: currentUser.email,
          subject: `🎉 It's a Match with ${currentProfile.full_name}!`,
          body: `
            <p>Hi ${currentUser.full_name},</p>
            <p>You and <strong>${currentProfile.full_name}</strong> have both liked each other. It's a mutual match!</p>
            <p>You can now start chatting with ${currentProfile.full_name}.</p>
            <br/>
            <a href="${window.location.origin}${createPageUrl('Matches')}" style="background-color: #ec4899; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Matches</a>
            <br/><br/>
            <p>Happy matching!</p>
            <p>The YouDating Team</p>
          `
        };
        const emailToThem = {
          to: currentProfile.email,
          subject: `🎉 It's a Match with ${currentUser.full_name}!`,
          body: `
            <p>Hi ${currentProfile.full_name},</p>
            <p>You and <strong>${currentUser.full_name}</strong> have both liked each other. It's a mutual match!</p>
            <p>You can now start chatting with ${currentUser.full_name}.</p>
            <br/>
            <a href="${window.location.origin}${createPageUrl('Matches')}" style="background-color: #ec4899; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Matches</a>
            <br/><br/>
            <p>Happy matching!</p>
            <p>The YouDating Team</p>
          `
        };
        if(currentUser.notifications_new_matches !== false && currentUser.notifications_email_new_matches !== false) sendEmailMutation.mutate(emailToUs);
        if(currentProfile.notifications_new_matches !== false && currentProfile.notifications_email_new_matches !== false) sendEmailMutation.mutate(emailToThem);
        
        if (isSuperMatch) {
            trackEvent(currentUser.email, 'superMatchCreated', { matchWith: currentProfile.email });
        }
      }
    }

    setTimeout(() => {
      setCurrentUserIndex(prev => prev + 1);
      setPhotoIndex(0);
      setDirection(0);
      if (showMatch) setShowMatch(null); // Close match modal on next swipe
    }, 300);
  };

  const handleBoost = () => {
      trackEvent(currentUser.email, 'boostTapped');
      if ((currentUser.boosts_remaining || 0) > 0) {
        const currentBoostExpiry = currentUser.boost_expires_at ? new Date(currentUser.boost_expires_at) : new Date();
        const boostDurationMinutes = config.boost_durationMinutes || 30;
        const newExpiry = add(currentBoostExpiry > new Date() ? currentBoostExpiry : new Date(), { minutes: boostDurationMinutes });
        
        updateUserMutation.mutate({
            boosts_remaining: currentUser.boosts_remaining - 1,
            boost_expires_at: newExpiry.toISOString(),
        });
        trackEvent(currentUser.email, 'boostStarted');
        toast.success("Boost activated!", { description: `Your profile is boosted for ${boostDurationMinutes} minutes.`});
      } else {
        toast.info("No Boosts Remaining", { description: "You can purchase more Boosts from the store." });
        navigate(createPageUrl("Store"));
      }
  }

  const handleRewind = () => {
      trackEvent(currentUser.email, 'rewindTapped');
      if (!isPremium) {
          trackEvent(currentUser.email, 'paywallViewed', { feature: 'rewind' });
          toast.info("Rewind requires Premium", { description: "Upgrade to Plus to undo your last swipe." });
          setShowPaywall(true);
          return;
      }
      if (lastSwipedProfileId && currentUserIndex > 0) {
          toast.success("Rewound last swipe!");
          setCurrentUserIndex(prev => prev - 1);
          setLastSwipedProfileId(null); // Clear after rewind to prevent multiple rewinds on the same profile
      } else {
          toast.info("Nothing to rewind.");
      }
  }

  const nextPhoto = () => {
    if (currentProfile?.photos && currentProfile.photos.length > 0 && photoIndex < currentProfile.photos.length - 1) {
      setPhotoIndex(prev => prev + 1);
    }
  };

  const prevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const boostTimer = setInterval(() => {
        if (currentUser?.boost_expires_at && new Date(currentUser.boost_expires_at) > new Date()) {
            setBoostTimeLeft(formatDistanceToNow(new Date(currentUser.boost_expires_at), { addSuffix: true, includeSeconds: true }));
        } else {
            setBoostTimeLeft('');
        }
    }, 1000);
    return () => clearInterval(boostTimer);
  }, [currentUser?.boost_expires_at]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser.profile_completed) {
    return null; // Redirect handled by onSuccess of useQuery
  }

  const isBoostActive = currentUser?.boost_expires_at && new Date(currentUser.boost_expires_at) > new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Discover
            </h1>
            <p className="text-gray-600">Find your perfect match</p>
          </div>
          {!isBoostActive ? (
            <Card className="p-4 bg-purple-50 border-purple-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-purple-800">Boost Your Profile!</h3>
                <p className="text-sm text-purple-700">Get more profile views.</p>
              </div>
              <Button onClick={handleBoost} className="bg-purple-600 hover:bg-purple-700" disabled={(currentUser.boosts_remaining || 0) === 0}>
                <Zap className="w-4 h-4 mr-2"/> Use Boost ({(currentUser.boosts_remaining || 0)} left)
              </Button>
            </Card>
          ) : (
            <Card className="p-4 bg-green-50 border-green-200 text-center">
              <h3 className="font-bold text-green-800 flex items-center justify-center gap-2"><Zap className="text-green-600 animate-pulse"/> Profile Boost is Active!</h3>
              <p className="text-sm text-green-700">You're being seen by more people. Time left: {boostTimeLeft.replace('in ', '')}</p>
            </Card>
          )}
        </div>

        <AnimatePresence>
          {showMatch && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMatch(null)}
            >
              <Card className="p-8 text-center bg-white max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                <Heart className="w-20 h-20 text-rose-500 fill-rose-500 mx-auto mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">It's a Match!</h2>
                <p className="text-gray-600 mb-4">You and {showMatch.full_name} liked each other</p>
                <Button 
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    onClick={() => navigate(createPageUrl("Messages") + `?user=${showMatch.email}`)}
                >
                    Send a Message
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {showPaywall && <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} config={config} />}

        {isLoadingUsers || isLoadingLikes || isLoadingMatches ? (
          <div className="flex items-center justify-center h-[600px]">
            <Heart className="w-16 h-16 text-rose-500 animate-pulse mx-auto" />
          </div>
        ) : potentialMatches.length === 0 || currentUserIndex >= potentialMatches.length ? (
          <Card className="p-12 text-center h-[600px] flex flex-col justify-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No More Profiles</h3>
            <p className="text-gray-600">You've seen everyone nearby. Try widening your filters or check back later!</p>
            <Button className="mt-4" onClick={() => navigate(createPageUrl("Profile"))}>Adjust Filters</Button>
          </Card>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentUserIndex}
              initial={{ opacity: 0, x: direction * 300, rotate: direction * 15 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: direction * -300, rotate: direction * -15 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Card className="overflow-hidden shadow-2xl rounded-2xl relative">
                <div className="relative h-[500px] md:h-[600px] bg-gray-200">
                  {currentProfile?.photos && currentProfile.photos.length > 0 ? (
                    <>
                      <img
                        src={currentProfile.photos[photoIndex]}
                        alt={currentProfile.full_name}
                        className="w-full h-full object-cover"
                      />
                      {currentProfile.photos.length > 1 && (
                        <>
                          <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
                            {currentProfile.photos.map((_, idx) => (
                              <div
                                key={idx}
                                className={`h-1 flex-1 rounded-full ${
                                  idx === photoIndex ? 'bg-white' : 'bg-white/40'
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            onClick={prevPhoto}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            disabled={photoIndex === 0}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={nextPhoto}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            disabled={photoIndex === currentProfile.photos.length - 1}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                  
                  {currentProfile.boost_expires_at && new Date(currentProfile.boost_expires_at) > new Date() && (
                    <div className="absolute inset-0 ring-4 ring-purple-500 ring-offset-2 rounded-2xl pointer-events-none animate-pulse"></div>
                  )}

                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    {currentProfile.boost_expires_at && new Date(currentProfile.boost_expires_at) > new Date() && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 pointer-events-none">
                            <Zap className="w-3 h-3 mr-1"/> Boosted
                        </Badge>
                    )}
                    {currentProfile?.is_verified && (
                      <VerificationBadge isVerified={true} size="default" />
                    )}
                    <BlockAndReport targetUser={currentProfile} currentUser={currentUser} />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-bold">
                        {currentProfile?.full_name}{currentProfile?.privacy_hide_age ? '' : `, ${calculateAge(currentProfile?.date_of_birth)}`}
                      </h2>
                    </div>
                    {currentProfile?.privacy_hide_distance !== true && (
                      <p className="text-white/90 flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4" />
                        {[currentProfile.city, currentProfile.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {currentProfile?.interests && currentProfile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.interests.slice(0, 3).map((interest, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-white/20 text-white border-white/30">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-white">
                  {currentProfile?.bio && (
                    <p className="text-gray-700 mb-4 h-12 line-clamp-2">{currentProfile.bio}</p>
                  )}
                  
                  <div className="flex gap-4 justify-center items-center">
                    {/* Rewind Button */}
                    <Button
                        variant="outline"
                        className="w-14 h-14 p-0 rounded-full border-2 border-amber-300 text-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center disabled:opacity-50"
                        onClick={handleRewind}
                        disabled={!lastSwipedProfileId || currentUserIndex === 0 || !isPremium}
                        title="Rewind last swipe"
                    >
                        <Rewind className="w-6 h-6" />
                    </Button>

                    {/* Dislike Button */}
                    <Button
                        variant="outline"
                        className="w-16 h-16 p-0 rounded-full border-2 border-gray-300 text-red-500 hover:border-red-400 hover:bg-red-50 transition-all flex items-center justify-center"
                        onClick={() => handleInteraction(false)}
                        title="Dislike"
                    >
                        <X className="w-8 h-8" />
                    </Button>

                    {/* Like Button */}
                    <Button
                        className="w-16 h-16 p-0 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                        onClick={() => handleInteraction(true)}
                        title="Like"
                    >
                        <Heart className="w-8 h-8 text-white fill-white" />
                    </Button>

                    {/* Super Like Button */}
                    <Button
                        variant="outline"
                        className="w-14 h-14 p-0 rounded-full border-2 border-blue-300 text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleInteraction(true, true)}
                        disabled={!isPremium && (currentUser.super_likes_remaining || 0) <= 0}
                        title="Super Like"
                    >
                        <Star className="w-6 h-6 fill-current" />
                    </Button>
                  </div>
                   <div className="text-center mt-3 h-5">
                      {!isPremium && <p className="text-sm text-blue-600 font-semibold">{currentUser?.super_likes_remaining || 0} Super Likes left</p>}
                      {isPremium && <p className="text-sm text-blue-600 font-semibold">{config.perks_plus_superLikesPerDay || 5} free Super Likes today!</p>}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
