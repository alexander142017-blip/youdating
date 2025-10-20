
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Compat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PaywallModal from "../components/shared/PaywallModal";

export default function LikesYouPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showPaywall, setShowPaywall] = useState(false);

    const { data: currentUser } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => base44.auth.me(),
    });

    const { data: inboundLikes, isLoading: isLoadingLikes } = useQuery({
        queryKey: ['inbound-likes', currentUser?.email],
        queryFn: () => base44.entities.Like.filter({
            to_email: currentUser?.email,
            is_like: true
        }),
        enabled: !!currentUser,
    });

    const { data: myActions } = useQuery({
        queryKey: ['my-likes', currentUser?.email],
        queryFn: () => base44.entities.Like.filter({ from_email: currentUser?.email }),
        enabled: !!currentUser,
    });

    const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['all-users-likes-you'],
        queryFn: () => base44.entities.User.list(),
        enabled: !!inboundLikes && inboundLikes.length > 0
    });

    const isPremium = currentUser?.isPremium && new Date(currentUser.premiumExpiresAt) > new Date();

    const likers = useMemo(() => {
        if (!inboundLikes || !allUsers || !myActions) return [];
        const myActionsSet = new Set(myActions.map(a => a.to_email));
        return inboundLikes
            .filter(like => !myActionsSet.has(like.from_email)) // Filter out users I've already acted on
            .map(like => allUsers.find(u => u.email === like.from_email))
            .filter(Boolean); // Filter out any undefined users
    }, [inboundLikes, allUsers, myActions]);

    const likeMutation = useMutation({
        mutationFn: (data) => base44.entities.Like.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inbound-likes'] });
            queryClient.invalidateQueries({ queryKey: ['my-likes'] });
        }
    });

    const handleLike = (user) => {
        if (!user) return;
        likeMutation.mutate({
            from_email: currentUser.email,
            to_email: user.email,
            is_like: true,
            type: 'normal',
        });
        // Optimistically remove from UI
    };
    
    if (isLoadingLikes || isLoadingUsers) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <Heart className="w-16 h-16 text-rose-500 animate-pulse mx-auto mb-4" />
          </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                        Who Likes You
                    </h1>
                    <p className="text-gray-600">
                        These people have already liked your profile.
                    </p>
                </div>

                {!isPremium && likers.length > 0 && (
                    <Card className="mb-8 p-6 text-center bg-gradient-to-br from-rose-50 to-amber-50 border-amber-200">
                        <Lock className="w-12 h-12 mx-auto text-amber-500 mb-3"/>
                        <CardTitle className="mb-2">Unlock Your Admirers</CardTitle>
                        <CardDescription className="mb-4 max-w-md mx-auto">
                            Upgrade to YouDating Plus to see everyone who likes you and match instantly.
                        </CardDescription>
                        <Button onClick={() => navigate(createPageUrl("Store"))}>Upgrade to Plus</Button>
                    </Card>
                )}

                {likers.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Likes Yet</h3>
                        <p className="text-gray-600">Keep your profile active to attract more matches!</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {likers.map(user => (
                            <Card key={user.id} className="overflow-hidden relative group">
                                <img
                                    src={user.photos?.[0] || ''}
                                    alt={user.full_name}
                                    className={`w-full h-full object-cover aspect-[3/4] ${!isPremium ? 'blur-lg' : ''}`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex flex-col justify-end">
                                    <h3 className={`font-bold text-white text-lg ${!isPremium ? 'blur-sm' : ''}`}>{user.full_name}</h3>
                                </div>
                                {!isPremium ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                        <Lock className="w-10 h-10 text-white"/>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                        <Button size="icon" className="w-16 h-16 rounded-full bg-white/90 hover:bg-white" onClick={() => handleLike(user)}>
                                            <Heart className="w-8 h-8 text-rose-500 fill-rose-500"/>
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
        </div>
    );
}
