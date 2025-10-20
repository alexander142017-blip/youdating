
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Compat";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Heart, MapPin, MessageCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VerificationBadge from "../components/profile/VerificationBadge";
import { differenceInYears } from 'date-fns';

function calculateAge(dob) {
  if (!dob) return '';
  try {
    return differenceInYears(new Date(), new Date(dob));
  } catch (e) {
    return '';
  }
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [matchedUsers, setMatchedUsers] = useState([]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  const { data: matches, isLoading } = useQuery({
    queryKey: ['mutual-matches', currentUser?.email], // Updated queryKey
    queryFn: () => base44.entities.Match.filter({ 
      is_mutual: true,
      $or: [
        { user1_email: currentUser?.email },
        { user2_email: currentUser?.email }
      ]
    }),
    enabled: !!currentUser,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });
  
  // New query for blocks
  const { data: blocks } = useQuery({
    queryKey: ['blocks', currentUser?.email],
    queryFn: () => base44.entities.Block.list(),
    enabled: !!currentUser,
    initialData: [],
  });

  useEffect(() => {
    if (matches && allUsers && currentUser && blocks) { // Added 'blocks' to dependencies
      const blockedByCurrentUser = new Set(blocks.filter(b => b.blocker_email === currentUser.email).map(b => b.blocked_email));
      const currentUserIsBlockedBy = new Set(blocks.filter(b => b.blocked_email === currentUser.email).map(b => b.blocker_email));

      const matched = matches.map(match => {
        const otherUserEmail = match.user1_email === currentUser.email 
          ? match.user2_email 
          : match.user1_email;
          
        const user = allUsers.find(u => u.email === otherUserEmail);

        // Check if the other user is blocked, suspended, or not found
        if (!user || user.is_suspended || blockedByCurrentUser.has(otherUserEmail) || currentUserIsBlockedBy.has(otherUserEmail)) {
            return null; // Exclude this match
        }

        return { ...user, matchId: match.id, isSuperLike: match.is_super_like };
      }).filter(Boolean).sort((a, b) => {
        // Show superlikes first, then verified users
        if (a.isSuperLike && !b.isSuperLike) return -1;
        if (!a.isSuperLike && b.isSuperLike) return 1;
        if (a.is_verified && !b.is_verified) return -1;
        if (!a.is_verified && b.is_verified) return 1;
        return 0;
      });
      setMatchedUsers(matched);
    }
  }, [matches, allUsers, currentUser, blocks]); // Added 'blocks' to dependencies

  const handleMessage = (matchUser) => {
    navigate(createPageUrl("Messages") + `?user=${matchUser.email}`);
  };

  if (!currentUser || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-rose-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Your Matches
          </h1>
          <p className="text-gray-600">
            {matchedUsers.length} {matchedUsers.length === 1 ? 'person' : 'people'} you've matched with
          </p>
        </div>

        {matchedUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matches Yet</h3>
            <p className="text-gray-600 mb-4">Start swiping to find your perfect match!</p>
            <Button
              onClick={() => navigate(createPageUrl("Discover"))}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              Start Discovering
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedUsers.map((user) => (
              <Card key={user.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-64 bg-gray-200">
                  {user.photos && user.photos.length > 0 ? (
                    <img
                      src={user.photos[0]}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Heart className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {/* Updated section for badges */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {user.isSuperLike && ( // Conditional rendering for Super Like icon
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="w-5 h-5 text-white fill-white" />
                      </div>
                    )}
                    {user.is_verified && (
                      <VerificationBadge isVerified={true} size="small" />
                    )}
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {user.full_name}, {calculateAge(user.date_of_birth)}
                  </h3>
                  {user.privacy_show_location !== false && user.city && (
                    <p className="text-gray-600 text-sm flex items-center gap-1 mb-3">
                      <MapPin className="w-4 h-4" />
                      {[user.city, user.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  
                  {user.bio && (
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">{user.bio}</p>
                  )}
                  
                  {user.interests && user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {user.interests.slice(0, 3).map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-rose-50 text-rose-700">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    onClick={() => handleMessage(user)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
