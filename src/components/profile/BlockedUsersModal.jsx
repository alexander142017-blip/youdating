import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ShieldX } from 'lucide-react';
import { toast } from 'sonner';

export default function BlockedUsersModal({ isOpen, onClose, currentUser }) {
  const queryClient = useQueryClient();

  const { data: blocks, isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['blocks', currentUser?.email],
    queryFn: () => base44.entities.Block.list(),
    enabled: !!currentUser && isOpen,
  });
  
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser && isOpen && !!blocks && blocks.length > 0,
  });

  const unblockMutation = useMutation({
    mutationFn: (blockId) => base44.entities.Block.delete(blockId),
    onSuccess: () => {
      toast.success("User unblocked.");
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
    onError: () => {
      toast.error("Failed to unblock user.");
    }
  });

  const blockedUsers = React.useMemo(() => {
    if (!blocks || !allUsers) return [];
    return blocks.map(block => {
        const user = allUsers.find(u => u.email === block.blocked_email);
        return {
            blockId: block.id,
            ...user
        }
    }).filter(u => u.id); // Filter out cases where user might not be found
  }, [blocks, allUsers]);

  const handleUnblock = (blockId) => {
    unblockMutation.mutate(blockId);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Blocked Users</DialogTitle>
          <DialogDescription>
            Users you have blocked will not be able to see you or contact you.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-80 overflow-y-auto space-y-3 pr-2">
            {(isLoadingBlocks || isLoadingUsers) && <p>Loading...</p>}
            {!isLoadingBlocks && !isLoadingUsers && blockedUsers.length === 0 && (
                <div className="text-center py-8">
                    <ShieldX className="mx-auto w-12 h-12 text-gray-400"/>
                    <p className="mt-2 text-gray-600">No blocked users</p>
                </div>
            )}
            {blockedUsers.map(user => (
                <div key={user.blockId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.photos?.[0]} />
                            <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => handleUnblock(user.blockId)}
                        disabled={unblockMutation.isPending}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}