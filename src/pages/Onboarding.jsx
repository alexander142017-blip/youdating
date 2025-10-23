import { useState, useEffect, useRef } from 'react';
import { getCurrentSessionUser } from '@/api/session';
import { completeOnboarding } from '@/api/profiles';
import { supabase } from '@/api/supabase';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Heart, 
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  X
} from 'lucide-react';

const TOTAL_STEPS = 5;



export default function OnboardingPage() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        first_name: "",
        date_of_birth: "",
        gender: "",
        looking_for: "",
        city: "",
        bio: "",
        photos: []
    });

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const user = await getCurrentSessionUser();
            if (!user) {
                navigate(createPageUrl("auth"));
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            navigate(createPageUrl("auth"));
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (error) setError("");
    };

    const uploadPhotoToSupabase = async (file) => {
        try {
            // Get current user for folder organization
            const user = await getCurrentSessionUser();
            if (!user) throw new Error("User not authenticated");

            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('profile-photos')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const handlePhotoUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            setUploading(true);
            setError("");

            const uploadPromises = files.map(file => {
                // Validate file
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
                }
                if (!file.type.startsWith('image/')) {
                    throw new Error(`File ${file.name} is not an image.`);
                }
                return uploadPhotoToSupabase(file);
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            
            // Add to photos array (max 6 photos)
            setFormData(prev => ({
                ...prev,
                photos: [...prev.photos, ...uploadedUrls].slice(0, 6)
            }));

        } catch (err) {
            console.error("Photo upload error:", err);
            setError(err.message || "Failed to upload photo. Please try again.");
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removePhoto = (urlToRemove) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter(url => url !== urlToRemove)
        }));
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.first_name.trim()) {
                    setError("Please enter your first name");
                    return false;
                }
                if (formData.first_name.trim().length < 2) {
                    setError("First name must be at least 2 characters");
                    return false;
                }
                break;
            case 2:
                if (!formData.date_of_birth) {
                    setError("Please select your date of birth");
                    return false;
                }
                // Check if user is at least 18 years old
                const birthDate = new Date(formData.date_of_birth);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    setError("You must be at least 18 years old to use YouDating");
                    return false;
                }
                if (!formData.gender) {
                    setError("Please select your gender");
                    return false;
                }
                if (!formData.looking_for) {
                    setError("Please select who you're looking for");
                    return false;
                }
                break;
            case 3:
                if (formData.photos.length === 0) {
                    setError("Please upload at least one photo");
                    return false;
                }
                break;
            case 4:
                if (!formData.city.trim()) {
                    setError("Please enter your city");
                    return false;
                }
                break;
            case 5:
                if (!formData.bio.trim()) {
                    setError("Please write a short bio about yourself");
                    return false;
                }
                if (formData.bio.trim().length < 20) {
                    setError("Bio must be at least 20 characters long");
                    return false;
                }
                if (formData.bio.trim().length > 500) {
                    setError("Bio must be less than 500 characters");
                    return false;
                }
                break;
            default:
                return true;
        }
        
        setError("");
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setError("");
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            // Calculate age from date of birth
            const birthDate = new Date(formData.date_of_birth);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Prepare onboarding data
            const onboardingData = {
                first_name: formData.first_name.trim(),
                name: formData.first_name.trim(), // Alias for compatibility
                date_of_birth: formData.date_of_birth,
                age: age,
                gender: formData.gender,
                looking_for: formData.looking_for,
                city: formData.city.trim(),
                bio: formData.bio.trim(),
                photos: formData.photos, // JSONB array of photo URLs
                profile_photo_url: formData.photos[0] || null, // First photo as main
                has_photos: formData.photos.length > 0,
                onboarding_complete: true,
                profile_completed: true,
                show_on_discover: true, // Default to visible in discovery
                show_distance: true,
                show_age: true
            };

            // Verify user session before completing onboarding
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !session.user) {
                setError("Session expired. Please log in again.");
                navigate(createPageUrl("auth"));
                return;
            }

            const userId = session.user.id;

            // Complete onboarding
            await completeOnboarding(onboardingData);

            // Ensure onboarding_complete is set to true
            await supabase
                .from("profiles")
                .update({ onboarding_complete: true })
                .eq("user_id", userId);

            // Navigate to discover page
            navigate("/discover");
            
        } catch (err) {
            console.error("Onboarding completion error:", err);
            setError(err.message || "Failed to complete onboarding. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const genderOptions = [
        { value: "man", label: "Man" },
        { value: "woman", label: "Woman" },
        { value: "non-binary", label: "Non-binary" },
        { value: "other", label: "Other" }
    ];

    const lookingForOptions = [
        { value: "men", label: "Men" },
        { value: "women", label: "Women" },
        { value: "everyone", label: "Everyone" }
    ];

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="avatar placeholder mb-4">
                        <div className="bg-primary text-primary-content rounded-full w-16">
                            <Heart className="w-8 h-8" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
                    <p className="text-base-content/70">
                        Let's get to know you better to find your perfect match
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Step {currentStep} of {TOTAL_STEPS}</span>
                        <span className="text-sm text-base-content/60">
                            {Math.round((currentStep / TOTAL_STEPS) * 100)}% complete
                        </span>
                    </div>
                    <progress 
                        className="progress progress-primary w-full" 
                        value={currentStep} 
                        max={TOTAL_STEPS}
                    ></progress>
                </div>

                {/* Main Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        
                        {/* Step 1: Name */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <User className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">What's your name?</h2>
                                    <p className="text-sm text-base-content/70">
                                        This is how others will see you on YouDating
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">First Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                                        className="input input-bordered input-primary w-full"
                                        placeholder="Enter your first name"
                                        maxLength={50}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Basic Info */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <Calendar className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">About You</h2>
                                    <p className="text-sm text-base-content/70">
                                        Tell us a bit about yourself
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Date of Birth</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                        className="input input-bordered input-primary w-full"
                                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">I am a</span>
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="select select-bordered select-primary w-full"
                                    >
                                        <option value="">Select your gender</option>
                                        {genderOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Looking for</span>
                                    </label>
                                    <select
                                        value={formData.looking_for}
                                        onChange={(e) => handleInputChange('looking_for', e.target.value)}
                                        className="select select-bordered select-primary w-full"
                                    >
                                        <option value="">Who are you interested in?</option>
                                        {lookingForOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Photos */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <Camera className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">Add Your Photos</h2>
                                    <p className="text-sm text-base-content/70">
                                        Show your best self with great photos
                                    </p>
                                </div>

                                {/* Photo Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Existing Photos */}
                                    {formData.photos.map((photo, index) => (
                                        <div key={photo} className="relative aspect-square">
                                            <img 
                                                src={photo} 
                                                alt={`Profile photo ${index + 1}`}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                            {/* Main Photo Badge */}
                                            {index === 0 && (
                                                <div className="absolute top-2 left-2 badge badge-primary badge-sm">
                                                    Main
                                                </div>
                                            )}
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => removePhoto(photo)}
                                                className="btn btn-circle btn-xs btn-error absolute top-2 right-2"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Upload Button */}
                                    {formData.photos.length < 6 && (
                                        <div 
                                            className="aspect-square border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {uploading ? (
                                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 text-primary mb-2" />
                                                    <span className="text-sm text-primary font-medium">
                                                        Add Photo
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Hidden File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />

                                {/* Upload Instructions */}
                                <div className="bg-primary/5 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Camera className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium mb-1">Photo Tips</p>
                                            <ul className="text-base-content/70 space-y-1">
                                                <li>• Upload at least 1 photo (up to 6 total)</li>
                                                <li>• First photo becomes your main profile picture</li>
                                                <li>• Use clear, recent photos that show your face</li>
                                                <li>• Maximum 5MB per photo</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Location */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">Where are you?</h2>
                                    <p className="text-sm text-base-content/70">
                                        We'll help you find matches nearby
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">City</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        className="input input-bordered input-primary w-full"
                                        placeholder="Enter your city"
                                        maxLength={100}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt">
                                            e.g., New York, London, Tokyo
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Bio */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <FileText className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">Tell Your Story</h2>
                                    <p className="text-sm text-base-content/70">
                                        Share what makes you unique
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">About Me</span>
                                        <span className="label-text-alt">
                                            {formData.bio.length}/500
                                        </span>
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        className="textarea textarea-bordered textarea-primary w-full h-32"
                                        placeholder="Write something interesting about yourself... What are your hobbies? What are you passionate about? What kind of connection are you looking for?"
                                        maxLength={500}
                                    />
                                    <label className="label">
                                        <span className="label-text-alt">
                                            Minimum 20 characters
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="alert alert-error mt-6">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="btn btn-ghost"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </button>

                            {currentStep < TOTAL_STEPS ? (
                                <button
                                    onClick={nextStep}
                                    className="btn btn-primary"
                                >
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Completing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Complete Profile
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-base-content/60">
                        Your information is secure and will only be shared according to your privacy settings
                    </p>
                </div>
            </div>
        </div>
    );
}
