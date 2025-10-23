import { useRef, useState, useEffect } from 'react';
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, Shield } from "lucide-react";
import { toast } from 'sonner';

export default function VerificationModal({ isOpen, onClose, onVerified: _onVerified }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraReady(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !isCameraReady) return;

    // Start countdown
    setCountdown(3);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(2);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCountdown(null);

    setIsUploading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      /* const _file = */ new File([blob], `verification-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // TODO: Implement file upload using Supabase Storage
      toast.error("Photo upload not implemented. Implement using Supabase Storage in VerificationModal.jsx");
      
      // TODO: After implementing upload:
      // const file_url = await uploadToSupabase(file);
      // await upsertProfile({
      //   is_verified: true,
      //   verification_photo: file_url,
      //   verification_date: new Date().toISOString()
      // });
      // stopCamera();
      // onVerified();
      // onClose();
      
      throw new Error("Upload not implemented");
    } catch (error) {
      console.error("Error during verification:", error);
      toast.error("Verification failed. Please try again.");
    }

    setIsUploading(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-blue-500" />
            Verify Your Profile
          </DialogTitle>
          <DialogDescription className="text-base">
            Take a live photo to verify your identity. This helps build trust in our community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Verification Tips:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure you&apos;re in a well-lit area</li>
              <li>• Look directly at the camera</li>
              <li>• Remove sunglasses or hats</li>
              <li>• Position your face in the center of the frame</li>
            </ul>
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover mirror"
            />
            
            {!isCameraReady && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  Loading camera...
                </div>
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-8xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Face guide overlay */}
            {isCameraReady && countdown === null && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-4 border-white rounded-full opacity-50" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading || countdown !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isCameraReady || isUploading || countdown !== null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Verification Photo
                </>
              )}
            </Button>
          </div>
        </div>

        <style>{`
          .mirror {
            transform: scaleX(-1);
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

VerificationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onVerified: PropTypes.func,
};