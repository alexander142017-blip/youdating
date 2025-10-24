
import { useState } from 'react';
import PropTypes from 'prop-types';
import { UserShape } from '../types/propTypes';
import { getCurrentUser } from '@/api/auth';

import { supabase } from '@/api/supabase';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, UserX, UserCheck, Loader2, Gem, Star, Zap, Edit, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { format, add } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserManagementRow = ({ user, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [superLikes, setSuperLikes] = useState(user.super_likes_remaining || 0);
    const [boosts, setBoosts] = useState(user.boosts_remaining || 0);
    const isPremium = user.isPremium && new Date(user.premiumExpiresAt) > new Date();

    const handleSave = () => {
        onUpdate(user.id, { 
            super_likes_remaining: parseInt(superLikes, 10),
            boosts_remaining: parseInt(boosts, 10)
        });
        setIsEditing(false);
    }
    
    const handleTogglePremium = () => {
      if (isPremium) {
          onUpdate(user.id, { isPremium: false, premiumPlan: 'none', premiumExpiresAt: new Date().toISOString() });
      } else {
          onUpdate(user.id, { isPremium: true, premiumPlan: 'plus', premiumExpiresAt: add(new Date(), { days: 30 }).toISOString() });
      }
    }
    
    const handleClearBoost = () => {
        onUpdate(user.id, { boost_expires_at: null });
    }

    return (
        <TableRow>
            <TableCell>{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
                {isPremium && <Badge className="bg-amber-100 text-amber-800">Premium</Badge>}
                {user.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                {user.boost_expires_at && new Date(user.boost_expires_at) > new Date() && <Badge className="bg-purple-100 text-purple-800">Boosted</Badge>}
            </TableCell>
            <TableCell className="text-center">
                {isEditing ? <Input type="number" value={superLikes} onChange={e => setSuperLikes(e.target.value)} className="w-20" /> : superLikes}
            </TableCell>
            <TableCell className="text-center">
                {isEditing ? <Input type="number" value={boosts} onChange={e => setBoosts(e.target.value)} className="w-20" /> : boosts}
            </TableCell>
            <TableCell>{format(new Date(user.created_date), 'MMM d, yyyy')}</TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                        <>
                            <Button size="sm" onClick={handleSave}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-1"/> Edit</Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">Actions</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={handleTogglePremium}>
                                <Gem className="w-4 h-4 mr-2"/> {isPremium ? "Revoke" : "Grant"} Premium
                            </DropdownMenuItem>
                             {user.boost_expires_at && new Date(user.boost_expires_at) > new Date() && (
                                <DropdownMenuItem onClick={handleClearBoost}>
                                    <XCircle className="w-4 h-4 mr-2"/> End Boost
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user.id)}>
                                <UserX className="w-4 h-4 mr-2"/> Delete User
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </TableCell>
        </TableRow>
    )
}

UserManagementRow.propTypes = {
  user: UserShape.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    onSuccess: (user) => {
      if (user?.role !== 'admin') {
        navigate(createPageUrl('Discover'));
        toast.error("Access Denied", { description: "You do not have permission to view this page." });
      }
    },
  });

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['all-reports'],
    queryFn: async () => { 
      // TODO: Implement reports query using Supabase
      const { data } = await supabase.from('reports').select('*').order('created_date', { ascending: false }); 
      return data || []; 
    },
    enabled: currentUser?.role === 'admin',
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: async () => { const { data } = await supabase.from('profiles').select('*'); return data || []; },
    enabled: currentUser?.role === 'admin',
    staleTime: 5 * 60 * 1000, 
  });
  
  const updateUserMutation = useMutation({
      mutationFn: async ({userId, data}) => {
        // TODO: Implement user update using Supabase
        const { data: result } = await supabase.from('profiles').update(data).eq('user_id', userId).select().maybeSingle();
        return result;
      },
      onSuccess: (data, variables) => {
          toast.success(`User ${variables.userId} updated.`);
          queryClient.invalidateQueries({queryKey: ['all-users-admin']});
      },
      onError: (err, variables) => toast.error(`Failed to update user ${variables.userId}.`)
  });
  
  const deleteUserMutation = useMutation({
      mutationFn: async (userId) => {
        // TODO: Implement user deletion using Supabase
        await supabase.from('profiles').delete().eq('user_id', userId);
      },
      onSuccess: () => {
          toast.success("User has been deleted.");
          queryClient.invalidateQueries({queryKey: ['all-users-admin']});
          queryClient.invalidateQueries({queryKey: ['all-reports']});
      },
      onError: () => {
          toast.error("Failed to delete user.");
      }
  });

  const getUser = (email) => users?.find(u => u.email === email);
  
  const handleDeleteUser = (userId) => {
      if(window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")){
          deleteUserMutation.mutate(userId);
      }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage user reports and platform safety.</p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Reports</CardTitle>
            <CardDescription>
              {isLoadingReports ? 'Loading reports...' : `Found ${reports?.length || 0} reports.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingReports || isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : reports?.length > 0 ? (
                  reports.map((report) => {
                    const reportedUser = getUser(report.reported_email);
                    const reporterUser = getUser(report.reporter_email);

                    return (
                      <TableRow key={report.id}>
                        <TableCell>{format(new Date(report.created_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{reportedUser?.full_name || report.reported_email}</TableCell>
                        <TableCell>{reporterUser?.full_name || report.reporter_email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.reason.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">Actions</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => alert("Viewing user profile is not yet implemented.")}>
                                        <UserCheck className="w-4 h-4 mr-2"/> View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <AlertTriangle className="w-4 h-4 mr-2"/> Warn User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled>
                                        <UserX className="w-4 h-4 mr-2"/> Suspend User
                                    </DropdownMenuItem>
                                    {reportedUser && (
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(reportedUser.id)} disabled={deleteUserMutation.isPending}>
                                        <Trash2 className="w-4 h-4 mr-2"/> Delete User
                                    </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No reports found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center"><Star className="w-4 h-4 inline-block"/></TableHead>
                            <TableHead className="text-center"><Zap className="w-4 h-4 inline-block"/></TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingUsers ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : users?.map(user => (
                            <UserManagementRow 
                                key={user.id}
                                user={user}
                                onUpdate={updateUserMutation.mutate}
                                onDelete={handleDeleteUser}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
