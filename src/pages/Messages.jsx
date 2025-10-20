
import React, { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "@/api/auth";
import { filterMatches } from "@/api/matches";
import { listProfiles } from "@/api/profiles";
import { listBlocks } from "@/api/blocks";
import { createMessage, filterMessages, updateMatch } from "@/api/messages";
import { SendEmail } from "@/api/integrations-local";
import { createAnalyticsEvent } from "@/api/analytics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import BlockAndReport from "../components/shared/BlockAndReport";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { differenceInYears, formatDistanceToNowStrict } from 'date-fns';

const trackEvent = (userEmail, eventType, context = {}) => {
    createAnalyticsEvent({
        user_email: userEmail,
        type: eventType,
        context,
        day: format(new Date(), 'yyyy-MM-dd')
    }).catch(err => console.error("Analytics event failed:", err));
};

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const userEmailParam = urlParams.get('user');

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadCurrentUser();
  }, []);

  const { data: matches, refetch: refetchMatchesData } = useQuery({
    queryKey: ['mutual-matches', currentUser?.email],
    queryFn: () => filterMatches({ 
      is_mutual: true,
      $or: [
        { user1_email: currentUser?.email },
        { user2_email: currentUser?.email }
      ]
    }),
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: allUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: listProfiles,
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: blocks } = useQuery({
    queryKey: ['blocks', currentUser?.email],
    queryFn: listBlocks,
    enabled: !!currentUser,
    initialData: [],
  });
  
  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedUser?.matchId],
    queryFn: () => filterMessages({ 
      match_id: selectedUser?.matchId 
    }, 'created_date'),
    enabled: !!selectedUser?.matchId,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
    initialData: [],
  });

  useEffect(() => {
    if (userEmailParam && allUsers.length > 0 && matches.length > 0 && !selectedUser) {
      const match = matches.find(m => 
        m.user1_email === userEmailParam || m.user2_email === userEmailParam
      );
      if (match) {
        const user = allUsers.find(u => u.email === userEmailParam);
        if (user) {
          setSelectedUser({ ...user, matchId: match.id });
        }
      }
    }
  }, [userEmailParam, allUsers, matches, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: createMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser?.matchId] });
      setNewMessage("");
      toast.success("Message sent");
    },
    onError: () => {
      toast.error("Failed to send message. Please try again.");
    }
  });
  
  const sendEmailMutation = useMutation({
    mutationFn: SendEmail,
    onError: (error) => {
      // Fail silently
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({id, data}) => updateMatch(id, data),
    onSuccess: () => {
        refetchMatchesData();
    }
  });

  const matchedUsers = React.useMemo(() => {
    if (!matches || !allUsers || !blocks || !currentUser) return [];

    const blockedByCurrentUser = new Set(blocks.filter(b => b.blocker_email === currentUser.email).map(b => b.blocked_email));
    const currentUserIsBlockedBy = new Set(blocks.filter(b => b.blocked_email === currentUser.email).map(b => b.blocker_email));

    return matches.map(match => {
      const otherUserEmail = match.user1_email === currentUser?.email 
        ? match.user2_email 
        : match.user1_email;

      const user = allUsers.find(u => u.email === otherUserEmail);

      if (!user || user.is_suspended || blockedByCurrentUser.has(otherUserEmail) || currentUserIsBlockedBy.has(otherUserEmail)) {
        return null;
      }
      
      return { ...user, matchId: match.id, lastMessageAt: match.last_message_at };
    }).filter(Boolean).sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });
  }, [matches, allUsers, blocks, currentUser]);

  // Logic to handle when a selected chat user gets blocked or suspended
  useEffect(() => {
    if (selectedUser) {
        const isBlocked = !matchedUsers.some(u => u.id === selectedUser.id);
        if (isBlocked) {
            setSelectedUser(null);
            toast.info("Conversation ended.", {
              description: "The user has been blocked, suspended, or has blocked you.",
            });
        }
    }
  }, [matchedUsers, selectedUser]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    trackEvent(currentUser.email, 'messageSent', { matchId: selectedUser.matchId });

    sendMessageMutation.mutate({
      match_id: selectedUser.matchId,
      sender_email: currentUser.email,
      receiver_email: selectedUser.email,
      content: newMessage.trim()
    });
    
    updateMatchMutation.mutate({
        id: selectedUser.matchId,
        data: { last_message_at: new Date().toISOString() }
    });

    if (selectedUser.notifications_new_messages !== false && selectedUser.notifications_email_new_messages !== false) {
      sendEmailMutation.mutate({
        to: selectedUser.email,
        subject: `You have a new message from ${currentUser.full_name}`,
        body: `
          <p>Hi ${selectedUser.full_name},</p>
          <p>You've received a new message from <strong>${currentUser.full_name}</strong>.</p>
          <p>Open YouDating to read the message and reply!</p>
          <br/>
          <a href="${window.location.origin}${createPageUrl('Messages')}" style="background-color: #ec4899; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Go to Messages</a>
          <br/><br/>
          <p>The YouDating Team</p>
        `,
      });
    }
  };

  if (!currentUser) {
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
    <div className="h-screen flex flex-col md:flex-row bg-white">
      {/* Conversations List */}
      <div className={`${selectedUser ? 'hidden md:block' : 'block'} w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {matchedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No conversations yet</p>
            </div>
          ) : (
            matchedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-amber-50 transition-colors border-b border-gray-100 ${
                  selectedUser?.id === user.id ? 'bg-amber-50' : ''
                }`}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.photos?.[0]} />
                  <AvatarFallback className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white">
                    {user.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.lastMessageAt ? `Active ${formatDistanceToNowStrict(new Date(user.lastMessageAt))} ago`: 'Tap to chat'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedUser(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser.photos?.[0]} />
                <AvatarFallback className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white">
                  {selectedUser.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedUser.full_name}</p>
              </div>
              <BlockAndReport targetUser={selectedUser} currentUser={currentUser} matchId={selectedUser.matchId} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Heart className="w-16 h-16 text-amber-300 mx-auto mb-3" />
                    <p className="text-gray-600">Start your conversation!</p>
                    <p className="text-sm text-gray-500 mt-1">Say hello to {selectedUser.full_name}</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 items-end ${message.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.sender_email !== currentUser.email && (
                          <Avatar className="w-7 h-7 self-end mb-1">
                              <AvatarImage src={selectedUser.photos?.[0]} />
                              <AvatarFallback className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-xs">
                                {selectedUser.full_name?.[0]}
                              </AvatarFallback>
                          </Avatar>
                      )}
                      <div className="flex flex-col max-w-[70%]">
                        <div
                          className={`px-4 py-2.5 ${
                            message.sender_email === currentUser.email
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-2xl rounded-bl-2xl'
                              : 'bg-white text-gray-900 border border-gray-200 rounded-t-2xl rounded-br-2xl'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <span className={`text-xs text-gray-400 mt-1 px-1 ${message.sender_email === currentUser.email ? 'text-right' : 'text-left'}`}>
                          {format(new Date(message.created_date), 'p')}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sendMessageMutation.isPending && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 w-24"
                >
                  {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex items-center justify-center h-full">
            <div className="text-center">
              <Heart className="w-20 h-20 text-amber-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600">Select a conversation</p>
              <p className="text-sm text-gray-500 mt-2">Choose someone to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
