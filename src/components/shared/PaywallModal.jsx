import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gem, CheckCircle } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PremiumFeature = ({ text }) => (
    <li className="flex items-center gap-3">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        </div>
        <span className="text-gray-700">{text}</span>
    </li>
);

export default function PaywallModal({ isOpen, onClose, config = {} }) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate(createPageUrl("Store"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <Gem className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <DialogTitle className="text-2xl">Go Premium. Match Smarter.</DialogTitle>
          <DialogDescription className="pt-2">
            Unlock the best features to maximize your matching potential.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <ul className="space-y-3">
                <PremiumFeature text="Unlimited Likes" />
                <PremiumFeature text="Rewind your last swipe" />
                <PremiumFeature text="See who has liked you" />
                <PremiumFeature text={`${config.perks_plus_boostsPerWeek || 1} Free Boost${(config.perks_plus_boostsPerWeek || 1) > 1 ? 's' : ''} per week`} />
            </ul>
        </div>
        <div className="text-center mb-2">
            <p className="text-3xl font-bold">${config.pricing_plus_monthly || '9.99'}<span className="text-base font-normal text-gray-500">/month</span></p>
        </div>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            <Button
                className="w-full text-lg py-6 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                onClick={handleUpgrade}
            >
                Get YouDating Plus
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full">
                Maybe Later
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}