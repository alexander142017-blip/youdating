
import React, { useMemo, useEffect } from "react";
import { getCurrentUser } from "@/api/auth";
import { upsertProfile } from "@/api/profiles";
import { createPurchase } from "@/api/purchases";
import { listConfig } from "@/api/config";
import { createAnalyticsEvent } from "@/api/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Gem, Star, Zap, Check, Sparkles, Heart, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { add, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const trackEvent = (userEmail, eventType, context = {}) => {
    createAnalyticsEvent({
        user_email: userEmail,
        type: eventType,
        context,
        day: format(new Date(), 'yyyy-MM-dd')
    });
};

const PremiumFeature = ({ icon, text }) => {
    const Icon = icon;
    return (
        <li className="flex items-center gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <Icon className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700">{text}</span>
        </li>
    )
};

const ConsumableCard = ({ icon, title, description, price, onPurchase, isPending, productId, user }) => {
    const Icon = icon;
    return (
        <Card className="flex flex-col" onClick={() => trackEvent(user.email, 'productTapped', { productId })}>
            <CardHeader className="flex-row items-center gap-4">
                <Icon className="w-10 h-10 text-amber-500" />
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-3xl font-bold">${price}</p>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={onPurchase} disabled={isPending}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Purchase"}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function StorePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
      queryKey: ['current-user'],
      queryFn: getCurrentUser
  });
  
  const { data: configData, isLoading: isLoadingConfig } = useQuery({
      queryKey: ['app-config'],
      queryFn: listConfig,
  });

  const config = useMemo(() => {
    if (!configData) return {};
    return configData.reduce((acc, item) => {
        const key = item.key.replace(/\./g, '_');
        acc[key] = item.value.val;
        return acc;
    }, {});
  }, [configData]);

  const updateUserMutation = useMutation({
    mutationFn: (data) => upsertProfile(currentUser?.id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      const successMessages = {
          plus: "You are now a YouDating Plus member!",
          boost: "Boost purchased successfully!",
          superLike5: "5 Super Likes added!",
          superLike20: "20 Super Likes added!"
      }
      
      const successDescriptions = {
          plus: "Enjoy your new premium perks.",
          boost: "Your profile will be shown to more people.",
          superLike5: "Go make someone feel special!",
          superLike20: "Go make someone feel special!",
      }
      
      toast.success(successMessages[variables.type], {
          description: successDescriptions[variables.type]
      });

      if (variables.type === 'plus') {
          trackEvent(currentUser.email, 'premiumUnlocked');
      }
    },
    onError: (error, variables) => {
        toast.error(`Purchase of ${variables.type} failed. Please try again.`);
    }
  });
  
  const createPurchaseRecordMutation = useMutation({
      mutationFn: (data) => createPurchase({ userId: currentUser?.id, ...data }),
      onError: () => {} // Fail silently on analytics
  });

  const handlePurchase = (type, productId) => {
    const startDate = new Date();
    let mutationData = {};
    let purchaseRecord = {
        user_email: currentUser.email,
        platform: "mock",
        productId,
        type: "subscription",
        status: "active",
        startedAt: startDate.toISOString(),
    };

    trackEvent(currentUser.email, 'upgradeTapped', { productId });

    switch(type) {
        case 'plus':
            const expiryDate = add(startDate, { days: 30 });
            mutationData = {
                isPremium: true,
                premiumPlan: 'plus',
                premiumExpiresAt: expiryDate.toISOString(),
            };
            purchaseRecord = { ...purchaseRecord, expiresAt: expiryDate.toISOString() };
            break;
        case 'boost':
            mutationData = { boosts_remaining: (currentUser.boosts_remaining || 0) + 1 };
            purchaseRecord = { ...purchaseRecord, type: "consumable" };
            trackEvent(currentUser.email, 'boostPurchased');
            break;
        case 'superLike5':
            mutationData = { super_likes_remaining: (currentUser.super_likes_remaining || 0) + 5 };
            purchaseRecord = { ...purchaseRecord, type: "consumable" };
            trackEvent(currentUser.email, 'superLikePackPurchased', { quantity: 5 });
            break;
        case 'superLike20':
            mutationData = { super_likes_remaining: (currentUser.super_likes_remaining || 0) + 20 };
            purchaseRecord = { ...purchaseRecord, type: "consumable" };
            trackEvent(currentUser.email, 'superLikePackPurchased', { quantity: 20 });
            break;
        default:
            return;
    }
    
    updateUserMutation.mutate({ ...mutationData, type });
    createPurchaseRecordMutation.mutate(purchaseRecord);
  };
  
  useEffect(() => {
    if(currentUser?.email) {
        trackEvent(currentUser.email, 'storeViewed');
    }
  }, [currentUser]);

  const isPremium = currentUser?.isPremium && new Date(currentUser?.premiumExpiresAt) > new Date();
  
  if (isLoadingConfig || !currentUser) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-rose-500" /></div>
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
            YouDating Store
          </h1>
          <p className="text-gray-600">
            Upgrade your experience or purchase items to stand out.
          </p>
        </div>

        <Card className="mb-12 shadow-2xl bg-white" onClick={() => trackEvent(currentUser.email, 'productTapped', { productId: 'plus_monthly' })}>
            <CardHeader className="text-center bg-gradient-to-br from-rose-50 to-amber-50 p-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                <CardTitle className="text-2xl">Go Premium with Plus</CardTitle>
                <CardDescription>Match smarter, not harder.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                 <ul className="space-y-4 mb-8">
                    <PremiumFeature icon={Heart} text="Unlimited Likes" />
                    <PremiumFeature icon={Zap} text={`${config.perks_plus_boostsPerWeek || 6} Free Boost${(config.perks_plus_boostsPerWeek || 6) > 1 ? 's' : ''} per week`} />
                    <PremiumFeature icon={Star} text={`${config.perks_plus_superLikesPerDay || 5} Free Super Likes per day`} />
                    <PremiumFeature icon={Check} text="See who has liked you" />
                </ul>

                <div className="text-center mb-6">
                    <p className="text-4xl font-bold">${config.pricing_plus_monthly || '9.99'}<span className="text-base font-normal text-gray-500">/month</span></p>
                    <p className="text-xs text-gray-500 mt-1">Billed monthly. Cancel anytime.</p>
                </div>
                
                 {isPremium ? (
                     <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                        <h4 className="font-semibold text-green-800">You are a Plus Member!</h4>
                        <p className="text-sm text-green-700">Your plan expires on {new Date(currentUser.premiumExpiresAt).toLocaleDateString()}.</p>
                     </div>
                 ) : (
                    <Button
                        className="w-full text-lg py-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                        onClick={() => handlePurchase('plus', 'plus_monthly')}
                        disabled={updateUserMutation.isPending && updateUserMutation.vars?.type === 'plus'}
                    >
                        {updateUserMutation.isPending && updateUserMutation.vars?.type === 'plus' ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Gem className="w-5 h-5 mr-2" />}
                        Upgrade to Plus
                    </Button>
                 )}
            </CardContent>
             <CardFooter>
                 <p className="text-xs text-gray-400 text-center w-full">* This is a demonstration. No real payment will be processed. Clicking 'Upgrade' will grant you premium for 30 days.</p>
            </CardFooter>
        </Card>
        
        <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Consumables</h2>
            <p className="text-gray-600">Get more boosts and super likes.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <ConsumableCard
                icon={Zap}
                title="1 Boost"
                description="Top of the feed for 30 mins."
                price={config.pricing_boost_single || '2.99'}
                onPurchase={() => handlePurchase('boost', 'boost_single')}
                isPending={updateUserMutation.isPending && updateUserMutation.vars?.type === 'boost'}
                productId="boost_single"
                user={currentUser}
            />
            <ConsumableCard
                icon={Star}
                title="5 Super Likes"
                description="Really stand out."
                price={config.pricing_superLike_5 || '4.99'}
                onPurchase={() => handlePurchase('superLike5', 'superlike_5_pack')}
                isPending={updateUserMutation.isPending && updateUserMutation.vars?.type === 'superLike5'}
                productId="superlike_5_pack"
                user={currentUser}
            />
            <ConsumableCard
                icon={Package}
                title="20 Super Likes"
                description="Best value pack."
                price={config.pricing_superLike_20 || '14.99'}
                onPurchase={() => handlePurchase('superLike20', 'superlike_20_pack')}
                isPending={updateUserMutation.isPending && updateUserMutation.vars?.type === 'superLike20'}
                productId="superlike_20_pack"
                user={currentUser}
            />
        </div>
      </div>
    </div>
  );
}
