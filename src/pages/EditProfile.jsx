import { useState, useRef } from 'react';
import { getCurrentUser, getCurrentUserId } from '@/api/auth';
import { upsertProfile } from '@/api/profiles';
import { uploadProfilePhoto } from '@/api/storage';
import { debounce } from '@/utils/debounce';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Trash2, PlusCircle, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const MAX_PHOTOS = 6;
const MAX_INTERESTS = 10;

const trackEvent = (userEmail, eventType, context = {}) => {
    // TODO: Replace with event logging using supabase table
    console.log('Analytics event:', { userEmail, eventType, context, day: format(new Date(), 'yyyy-MM-dd') });
};

export default function EditProfilePage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        bio: '',
        interests: [],
        photos: []
    });
    const [interestInput, setInterestInput] = useState('');

    const { data: currentUser, isLoading: isLoadingUser } = useQuery({
        queryKey: ['current-user-edit'],
        queryFn: getCurrentUser,
        onSuccess: (user) => {
            if (user) {
                setFormData({
                    bio: user.bio || '',
                    interests: user.interests || [],
                    photos: user.photos || []
                });
            }
        },
    });

    const debouncedSave = React.useMemo(
        () =>
            debounce(async (patch) => {
                try {
                    const user_id = await getCurrentUserId();
                    if (!user_id) return;
                    await upsertProfile({ user_id, ...patch });
                    queryClient.invalidateQueries({ queryKey: ['current-user'] });
                    queryClient.invalidateQueries({ queryKey: ['current-user-edit'] });
                } catch (e) {
                    console.error('[debouncedSave] failed:', e);
                }
            }, 600),
        [queryClient]
    );

    const saveProfile = async () => {
        try {
            const user_id = await getCurrentUserId();
            if (!user_id) throw new Error('Not authenticated');
            
            await upsertProfile({ user_id, ...formData });
            trackEvent(currentUser?.email, 'profileEdited');
            toast.success('Profile updated successfully!');
            navigate(createPageUrl('Profile'));
        } catch (error) {
            toast.error('Failed to update profile.', { description: error.message });
        }
    };

    const uploadFileMutation = useMutation({
        mutationFn: (_file) => {
            // TODO: Implement file upload using Supabase Storage
            throw new Error('File upload not implemented. Implement using Supabase Storage in EditProfile.jsx');
        },
        onSuccess: (data) => {
            if (formData.photos.length < MAX_PHOTOS) {
                setFormData(prev => ({ ...prev, photos: [...prev.photos, data.file_url] }));
            } else {
                toast.warning(`You can only have a maximum of ${MAX_PHOTOS} photos.`);
            }
        },
        onError: () => {
            toast.error('Photo upload failed. Please try again.');
        }
    });

    const handlePhotoUpload = async (e) => {
        try {
            const file = e.target?.files?.[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
            }
            if (!file.type.startsWith('image/')) {
                throw new Error(`File ${file.name} is not an image.`);
            }

            const user_id = await getCurrentUserId();
            if (!user_id) throw new Error('No authed user');

            if (formData.photos.length >= MAX_PHOTOS) {
                throw new Error(`You can only have a maximum of ${MAX_PHOTOS} photos.`);
            }

            const publicUrl = await uploadProfilePhoto(file);

            // Local first for snappy UI, then background save
            setFormData(prev => {
                const nextPhotos = [...(prev.photos ?? []), publicUrl];
                upsertProfile({ user_id, photos: nextPhotos }).catch(console.error);
                return { ...prev, photos: nextPhotos };
            });
        } catch (err) {
            console.error('Photo upload error:', err);
            toast.error('Photo upload failed: ' + (err.message || 'Please try again'));
        } finally {
            if (e?.target) e.target.value = '';
        }
    };

    const handleRemovePhoto = (urlToRemove) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter(url => url !== urlToRemove)
        }));
    };

    const handleAddInterest = () => {
        if (interestInput.trim() && !formData.interests.includes(interestInput.trim()) && formData.interests.length < MAX_INTERESTS) {
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, interestInput.trim()]
            }));
            setInterestInput('');
        } else if (formData.interests.length >= MAX_INTERESTS) {
            toast.warning(`You can only add up to ${MAX_INTERESTS} interests.`);
        }
    };

    const handleRemoveInterest = (interestToRemove) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(interest => interest !== interestToRemove)
        }));
    };
    
    const handleSaveChanges = () => {
        updateProfileMutation.mutate(formData);
    };

    if (isLoadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Photos</CardTitle>
                        <CardDescription>Add up to {MAX_PHOTOS} photos. The first photo is your main profile picture.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            {formData.photos.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img src={url} alt={`Profile photo ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemovePhoto(url)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {formData.photos.length < MAX_PHOTOS && (
                                <div 
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {uploadFileMutation.isPending ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <>
                                            <ImagePlus className="w-8 h-8 mb-2" />
                                            <span className="text-sm text-center">Add Photo</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            accept="image/png, image/jpeg"
                            className="hidden"
                            disabled={uploadFileMutation.isPending}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>About Me</CardTitle>
                        <CardDescription>Write a short bio to tell people more about yourself.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
                            placeholder="Tell us about you..."
                            maxLength={500}
                            rows={5}
                        />
                         <p className="text-xs text-gray-500 text-right mt-1">{formData.bio.length} / 500</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Interests</CardTitle>
                        <CardDescription>Add up to {MAX_INTERESTS} interests that describe you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 mb-4">
                            <Input 
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                placeholder="e.g. Hiking, Coding, Art"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                            />
                            <Button onClick={handleAddInterest} variant="outline">
                                <PlusCircle className="w-4 h-4 mr-2" /> Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.interests.map((interest, index) => (
                                <Badge key={index} variant="secondary" className="text-base py-1 px-3 flex items-center gap-2">
                                    {interest}
                                    <button onClick={() => handleRemoveInterest(interest)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex justify-end gap-4">
                     <Button variant="outline" onClick={() => navigate(createPageUrl('Profile'))}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveChanges}
                        disabled={updateProfileMutation.isPending}
                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    >
                        {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}