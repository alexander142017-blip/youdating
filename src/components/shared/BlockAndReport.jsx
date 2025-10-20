
import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { MoreVertical, Shield, Flag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlock } from '@/api/blocks';
import { createReport } from '@/api/reports';
import { createAnalyticsEvent } from '@/api/analytics';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

const trackEvent = (userEmail, eventType, context = {}) => {
    createAnalyticsEvent({
        user_email: userEmail,
        type: eventType,
        context,
        day: format(new Date(), 'yyyy-MM-dd')
    }).catch(err => console.error("Analytics event failed:", err));
};

export default function BlockAndReport({ targetUser, currentUser, matchId }) {
  const queryClient = useQueryClient();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const blockMutation = useMutation({
    mutationFn: createBlock,
    onSuccess: () => {
      trackEvent(currentUser.email, 'userBlocked', { targetId: targetUser.id });
      toast.success(`${targetUser.full_name} has been blocked.`);
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['my-matches'] });
      queryClient.invalidateQueries({ queryKey: ['mutual-matches'] });
    },
    onError: () => toast.error("Failed to block user.")
  });

  const reportMutation = useMutation({
    mutationFn: createReport,
    onSuccess: (response, variables) => { // 'variables' contains the data sent to the mutationFn
      trackEvent(currentUser.email, 'reportSubmitted', { targetId: targetUser.id, reason: variables.reason });
      toast.success(`Report for ${targetUser.full_name} has been submitted.`);
      setIsReportModalOpen(false);
      setReportReason("");
      setReportDetails("");
    },
    onError: () => toast.error("Failed to submit report.")
  });

  const handleBlock = () => {
    blockMutation.mutate({
      blocker_email: currentUser.email,
      blocked_email: targetUser.email,
    });
  };
  
  const handleReportSubmit = () => {
    if (!reportReason) {
        toast.error("Please select a reason for the report.");
        return;
    }
    reportMutation.mutate({
        reporter_email: currentUser.email,
        reported_email: targetUser.email,
        reason: reportReason,
        details: reportDetails,
        match_id: matchId || null
    });
  }

  if (!targetUser || !currentUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                <Shield className="w-4 h-4 mr-2" />
                Block {targetUser.full_name}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Block {targetUser.full_name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to block this user? You will no longer see each other in the app, and they will not be able to contact you. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBlock} className="bg-red-600 hover:bg-red-700">Block</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DropdownMenuItem onClick={() => setIsReportModalOpen(true)}>
            <Flag className="w-4 h-4 mr-2" />
            Report {targetUser.full_name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {targetUser.full_name}</DialogTitle>
            <DialogDescription>
              Your report is anonymous. If you feel someone is in danger, please contact local law enforcement immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Reason for reporting</Label>
              <Select onValueChange={setReportReason} value={reportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam or promotion</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate content</SelectItem>
                  <SelectItem value="scam">Scam or fake profile</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea 
                id="details" 
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide more information..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReportSubmit} disabled={reportMutation.isPending}>
                {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
