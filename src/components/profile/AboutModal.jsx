import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lightbulb } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg mb-4">
                <Lightbulb className="w-7 h-7 text-white" />
            </div>
          <DialogTitle className="text-center text-2xl">About YouDating</DialogTitle>
          <DialogDescription className="text-center">
            Connecting people, one match at a time.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 text-sm text-gray-600 space-y-4">
          <p>
            Welcome to YouDating! Our mission is to create meaningful connections in a fun, safe, and modern dating environment. This application is a demonstration of the Base44 platform's capabilities, showcasing features like real-time messaging, profile matching, and dynamic feature management.
          </p>
          <p>
            Version: 1.0.0
          </p>
           <p>
            For support or inquiries, please contact us at: <a href="mailto:support@youdating.app" className="text-rose-500 hover:underline">support@youdating.app</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}