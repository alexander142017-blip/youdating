import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function LegalModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Legal Center</DialogTitle>
          <DialogDescription>
            Terms of Service & Privacy Policy
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 text-sm text-gray-600 space-y-4 overflow-y-auto flex-1 pr-3">
          <h3 className="font-bold text-base text-gray-800">Terms of Service</h3>
          <p>
            This is a demonstration application. By using YouDating, you agree that you are interacting with a simulated environment. No real transactions will be processed, and all data is for demonstration purposes only. You must be 18 years or older to use this service. You agree not to upload any objectionable content. We reserve the right to suspend or terminate accounts for any reason.
          </p>
          <h3 className="font-bold text-base text-gray-800 mt-6">Privacy Policy</h3>
          <p>
            We collect information you provide during onboarding, such as your name, date of birth, photos, and preferences. We also collect anonymous usage data to improve our service. We do not sell your personal data to third parties. Your location is used to find nearby matches but is not shared with other users without your consent. All user data is stored securely.
          </p>
          <p>
            For questions about these terms, please contact: <a href="mailto:legal@youdating.app" className="text-rose-500 hover:underline">legal@youdating.app</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}