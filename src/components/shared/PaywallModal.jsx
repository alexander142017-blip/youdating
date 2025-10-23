import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";

export default function PaywallModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Unlock this feature and more with YouDating Premium
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-6">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              This feature requires a premium subscription
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={onClose} className="flex-1">
              View Plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

PaywallModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};