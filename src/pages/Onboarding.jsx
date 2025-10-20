
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ImagePlus, Trash2, Bell, MapPin, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TOTAL_STEPS = 5;

// #region Step Components
const Step1_BasicInfo = ({ data, setData, user }) => (
    <div className="space-y-4">
        <div>
            <Label htmlFor="full_name">First Name</Label>
            <Input id="full_name" value={data.full_name} onChange={e => setData({ ...data, full_name: e.target.value })} placeholder="Your first name" />
        </div>
        <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={e => setData({ ...data, date_of_birth: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="gender">You are a</Label>
                <Select value={data.gender} onValueChange={gender => setData({ ...data, gender })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Man</SelectItem>
                        <SelectItem value="female">Woman</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="looking_for">Looking for</Label>
                <Select value={data.looking_for} onValueChange={looking_for => setData({ ...data, looking_for })}>
                    <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Men</SelectItem>
                        <SelectItem value="female">Women</SelectItem>
                        <SelectItem value="everyone">Everyone</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={data.city} onChange={e => setData({ ...data, city: e.target.value })} placeholder="e.g. San Francisco" />
        </div>
    </div>
);

const Step2_Photos = ({ data, setData }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setIsUploading(true);
            try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                if (data.photos.length < 6) {
                    setData(prev => ({ ...prev, photos: [...prev.photos, file_url] }));
                } else {
                    toast.warning("You can only upload a maximum of 6 photos.");
                }
            } catch (error) {
                toast.error("Photo upload failed. Please try again.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleRemovePhoto = (urlToRemove) => {
        setData(prev => ({ ...prev, photos: prev.photos.filter(url => url !== urlToRemove) }));
    };

    return (
        <div>
            <div className="grid grid-cols-3 gap-4">
                {data.photos.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-200">
                        <img src={url} alt={`Profile photo ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="destructive" size="icon" onClick={() => handleRemovePhoto(url)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                    </div>
                ))}
                {data.photos.length < 6 && (
                    <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => !isUploading && fileInputRef.current?.click()}>
                        {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><ImagePlus className="w-8 h-8 mb-2" /><span className="text-sm text-center">Add Photo</span></>}
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/png, image/jpeg" className="hidden" disabled={isUploading} />
            <p className="text-sm text-gray-500 mt-4">Upload at least 2 photos to continue. The first photo is your main picture.</p>
        </div>
    );
};

const Step3_Bio = ({ data, setData }) => (
    <div className="space-y-4">
        <div>
            <Label htmlFor="bio">Your Bio</Label>
            <Textarea id="bio" value={data.bio} onChange={e => setData({ ...data, bio: e.target.value })} placeholder="Tell us a bit about yourself..." maxLength={500} rows={5} />
            <p className="text-xs text-gray-500 text-right mt-1">{data.bio.length} / 500</p>
        </div>
    </div>
);

const Step4_Preferences = ({ data, setData }) => (
    <div className="space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Age range</Label>
                <span className="font-medium">{data.discovery_age_min} - {data.discovery_age_max}</span>
            </div>
            <Slider value={[data.discovery_age_min, data.discovery_age_max]} onValueChange={([min, max]) => setData({ ...data, discovery_age_min: min, discovery_age_max: max })} min={18} max={80} step={1} />
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Maximum distance</Label>
                <span className="font-medium">{data.discovery_max_distance} miles</span>
            </div>
            <Slider value={[data.discovery_max_distance]} onValueChange={([v]) => setData({ ...data, discovery_max_distance: v })} max={100} step={1} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="show_on_discover">Show me on Discover</Label>
            <Switch id="show_on_discover" checked={data.discovery_show_on_discover} onCheckedChange={v => setData({ ...data, discovery_show_on_discover: v })} />
        </div>
    </div>
);

const Step5_Permissions = () => (
    <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-gray-600"/></div>
            <div>
                <h4 className="font-semibold">Enable Location</h4>
                <p className="text-sm text-gray-600">We use your location to show you potential matches in your area.</p>
                <Button variant="link" className="p-0 h-auto mt-1" onClick={() => navigator.geolocation.getCurrentPosition(() => toast.success("Location enabled!"), () => toast.error("Could not enable location."))}>Enable Location Services</Button>
            </div>
        </div>
        <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Bell className="w-6 h-6 text-gray-600"/></div>
            <div>
                <h4 className="font-semibold">Enable Notifications</h4>
                <p className="text-sm text-gray-600">Get notified about new matches and messages so you don't miss out.</p>
                <Button variant="link" className="p-0 h-auto mt-1" onClick={() => Notification.requestPermission().then(res => { if(res === 'granted') toast.success("Notifications enabled!"); else toast.info("Notifications were not enabled.")})}>Enable Notifications</Button>
            </div>
        </div>
    </div>
);
// #endregion

const trackEvent = (userEmail, eventType, context = {}) => {
    base44.entities.AnalyticsEvents.create({
        user_email: userEmail,
        type: eventType,
        context,
        day: format(new Date(), 'yyyy-MM-dd')
    });
};

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        date_of_birth: '',
        gender: '',
        looking_for: 'everyone',
        city: '',
        photos: [],
        bio: '',
        discovery_age_min: 18,
        discovery_age_max: 35,
        discovery_max_distance: 50,
        discovery_show_on_discover: true,
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await base44.auth.me();
                setUser(currentUser);
                if (currentUser.profile_completed) {
                    navigate(createPageUrl('Discover'));
                } else {
                    trackEvent(currentUser.email, 'onboardingStarted');
                    setFormData(prev => ({ ...prev, full_name: currentUser.full_name || '' }));
                }
            } catch (e) {
                // This will be handled by the layout's auth check, redirecting to login.
            }
        };
        fetchUser();
    }, [navigate]);

    const updateUserMutation = useMutation({
        mutationFn: (data) => base44.auth.updateMe(data),
        onSuccess: () => {
            trackEvent(user.email, 'onboardingComplete');
            setIsSubmitting(false);
            setStep(s => s + 1); // Move to completion screen
        },
        onError: (error) => {
            setIsSubmitting(false);
            toast.error('Could not save profile.', { description: error.message });
        }
    });
    
    const validateStep = () => {
        switch (step) {
            case 1: return formData.full_name && formData.date_of_birth && formData.gender;
            case 2: return formData.photos.length >= 2;
            case 3: return formData.bio.length > 10;
            default: return true;
        }
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(s => s + 1);
        } else {
            toast.warning("Please complete all fields to continue.");
            if(step === 2) toast.warning("You need at least 2 photos.");
        }
    };
    
    const handleBack = () => setStep(s => s - 1);

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Get location before submitting
        navigator.geolocation.getCurrentPosition(
            (position) => {
                updateUserMutation.mutate({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    profile_completed: true,
                });
            },
            (error) => {
                // Still submit if location fails, just without coordinates
                updateUserMutation.mutate({
                    ...formData,
                    profile_completed: true,
                });
                toast.warning("Could not get precise location. Some features may be limited.");
            }
        );
    };
    
    const renderStep = () => {
        switch (step) {
            case 1: return <Step1_BasicInfo data={formData} setData={setFormData} user={user} />;
            case 2: return <Step2_Photos data={formData} setData={setFormData} />;
            case 3: return <Step3_Bio data={formData} setData={setFormData} />;
            case 4: return <Step4_Preferences data={formData} setData={setFormData} />;
            case 5: return <Step5_Permissions />;
            case 6: return (
                <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">You're All Set, {formData.full_name}!</h2>
                    <p className="text-gray-600 mt-2">Your profile is complete. Get ready to discover new people.</p>
                </div>
            );
            default: return null;
        }
    };

    const stepDetails = [
        { title: "About You", description: "Let's start with the basics." },
        { title: "Your Photos", description: "Show off your best self." },
        { title: "Your Bio", description: "Tell us a little about you." },
        { title: "Match Preferences", description: "Who are you looking for?" },
        { title: "App Permissions", description: "A few final things." },
        { title: "Welcome!", description: "" }
    ];

    if (!user) return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <Progress value={(step / TOTAL_STEPS) * 100} className="mb-4" />
                    <CardTitle>{stepDetails[step - 1].title}</CardTitle>
                    <CardDescription>{stepDetails[step - 1].description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderStep()}
                </CardContent>
                <CardContent>
                    <div className="flex justify-between items-center pt-4 border-t">
                        {step > 1 && step <= TOTAL_STEPS && (
                            <Button variant="ghost" onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                        )}
                        <div /> 
                        {step < TOTAL_STEPS && <Button onClick={handleNext}>Next</Button>}
                        {step === TOTAL_STEPS && <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/>Saving...</> : 'Save & Continue'}</Button>}
                        {step > TOTAL_STEPS && <Button onClick={() => navigate(createPageUrl('Discover'))}>Start Matching <Sparkles className="w-4 h-4 ml-2"/></Button>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
