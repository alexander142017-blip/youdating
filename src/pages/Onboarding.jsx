// DEV: keep this file formatted; mismatched braces will break Vite build.
/* eslint react/prop-types: 0 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/auth';
import { upsertProfile } from '../api/profiles';

/**
 * Get the current authenticated user or throw if not authenticated
 * @returns {Promise<User>} Supabase user object
 * @throws {Error} If not authenticated
 */
import { supabase } from '@/api/supabase';

import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/**
 * Ensure a profile exists for the authenticated user
 * @param {Object} session - Supabase session object
 * @returns {Object} - Profile data (existing or newly created)
 */
async function ensureProfile(session) {
  const uid = session.user.id;
  const email = session.user.email ?? null;
  
  try {
    console.log('[ONBOARDING] Checking for existing profile for user:', uid);
    
    // Try to get existing profile using centralized API
    const profile = await getProfile({ userId: uid });
    
    if (profile) {
      console.log('[ONBOARDING] Found existing profile:', profile);
      return profile;
    }

    console.log('[ONBOARDING] No profile found, creating minimal profile for user:', uid);
    
    // Create new profile using centralized API
    const inserted = await upsertProfile({
      user_id: uid,
      email,
      onboarding_complete: false,
      full_name: session.user.user_metadata?.full_name ?? null
    });
    
    console.log('[ONBOARDING] Created new profile:', inserted);
    return inserted;
  } catch (error) {
    console.error('[PROFILE ERROR]', error?.message || error);
    throw error;
  }
}
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
  X,
  Phone,
  Shield,
  Target
} from 'lucide-react';

// Phone verification is optional by default. Enable with VITE_REQUIRE_PHONE_VERIFICATION=1
const PHONE_VERIFICATION_REQUIRED = import.meta.env.VITE_REQUIRE_PHONE_VERIFICATION === '1';
const TOTAL_STEPS = PHONE_VERIFICATION_REQUIRED ? 7 : 5;

const OnboardingPage = () => {
    console.log('[ONBOARDING] Component rendering');
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationError, setLocationError] = useState("");
    const [coordinates, setCoordinates] = useState(null);
    const [detectedLocation, setDetectedLocation] = useState(null);
    const [formData, setFormData] = useState({
        first_name: "",
        date_of_birth: "",
        gender: "",
        looking_for: "",
        city: "",
        state: "",
        country: "",
        bio: "",
        photos: [],
        phone: "",
        phone_verified: false,
        verification_code: ""
    });
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [codeError, setCodeError] = useState("");
    const [, setPhoneSent] = useState(false);

    const checkAuthStatus = useCallback(async () => {
        try {
            const u = await getCurrentSessionUser();
            if (!u) {
                navigate(createPageUrl("auth"));
            } else {
                setUser(u);
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            navigate(createPageUrl("auth"));
        } finally {
            setLoadingUser(false);
        }
    }, [navigate]);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    if (loadingUser) return <div className="p-6">Loading...</div>;
    if (!user) return <div className="p-6">Please sign in to continue.</div>;



    async function savePatch(patch) {
        const user = await getCurrentUser();
        // Only send changed fields plus required identifiers
        const payload = {
            user_id: user.id,
            email: user.email ?? null,
            onboarding_complete: false,
            ...patch
        };
        await upsertProfile(payload);
        setFormData(prev => ({ ...prev, ...patch }));
    }

    const handleInputChange = async (field, value) => {
        // Clear error when user starts typing
        if (error) setError("");
        
        // Update local state immediately for responsiveness
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Save changes to server in background
        try {
            await savePatch({ [field]: value });
        } catch (error) {
            console.error(`Failed to save ${field} update:`, error);
            // Don't show error to user since local state is updated
        }
    };

    // Use the new RLS-compliant upload utility

    async function onUploadPhoto(file) {
        setError("");
        setUploading(true);
        
        try {
            const user = await getCurrentUser();
            
            // Enforce max 6 photos
            const current = Array.isArray(formData.photos) ? formData.photos : [];
            if (current.length >= 6) {
                throw new Error("You can upload up to 6 photos.");
            }
            
            // Upload the photo
            const { url } = await uploadProfilePhoto(file, user.id);
            
            // Save the new photos array
            await savePatch({ 
                photos: [...current, url] 
            });
            
        } catch (error) {
            const handledError = handleSupabaseError(error, 'photo upload');
            setError(handledError.message);
            console.error('Photo upload error:', error);
            throw error; // Re-throw for the UI handler
        } finally {
            setUploading(false);
        }
    }

    const handlePhotoUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            // Validate files
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
                }
                if (!file.type.startsWith('image/')) {
                    throw new Error(`File ${file.name} is not an image.`);
                }
            }

            // Upload files one by one to avoid overwhelming the UI
            for (const file of files) {
                await onUploadPhoto(file);
            }

        } catch (err) {
            console.error("Photo upload error:", err);
            setError(err.message || "Failed to upload photo. Please try again.");
        } finally {
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
        try {
            // Reset all error states
            setError("");
            setPhoneError("");
            setCodeError("");
            
            // Use centralized validation logic
            validateOnboardingStep(formData, step);
            
            // Phone-specific validations
            if (step === 6) {
                const phoneE164 = toE164(formData.phone, 'US');
                if (!phoneE164) {
                    throw new ValidationError("Please enter a valid phone number", 'phone');
                }
            }
            
            return true;
        } catch (error) {
            if (error instanceof ValidationError) {
                // Set appropriate error based on field
                if (error.field === 'phone') {
                    setPhoneError(error.message);
                } else if (error.field === 'verification_code') {
                    setCodeError(error.message);
                } else {
                    setError(error.message);
                }
            } else {
                setError(error.message || 'Validation failed');
            }
            return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            let nextStepNumber = currentStep + 1;
            
            // Skip phone verification steps (6-7) if phone verification is disabled
            if (!PHONE_VERIFICATION_REQUIRED && nextStepNumber === 6) {
                // Skip to the final step (which would be step 8 in original numbering, but is now the max)
                nextStepNumber = TOTAL_STEPS;
            }
            
            setCurrentStep(Math.min(nextStepNumber, TOTAL_STEPS));
        }
    };

    const prevStep = () => {
        let prevStepNumber = currentStep - 1;
        
        // Skip back over phone verification steps if they're disabled
        if (!PHONE_VERIFICATION_REQUIRED && currentStep === TOTAL_STEPS && TOTAL_STEPS === 5) {
            // If we're at step 5 (last step when phone disabled), go back to step 5
            prevStepNumber = 5;
        }
        
        setCurrentStep(Math.max(prevStepNumber, 1));
        setError("");
        setPhoneError("");
        setCodeError("");
    };

    const startPhoneVerification = async () => {
        try {
            setPhoneLoading(true);
            setPhoneError("");

            // Validate and format phone number
            const phoneE164 = toE164(formData.phone, 'US');
            if (!phoneE164) {
                setPhoneError("Please enter a valid phone number");
                return;
            }

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setPhoneError("Please log in again");
                return;
            }

            // Call verification API
            const response = await fetch('/api/phone/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    phone: phoneE164 
                })
            });

            const result = await response.json();

            if (result.ok) {
                setPhoneSent(true);
                setFormData(prev => ({
                    ...prev,
                    phone: phoneE164 // Store the formatted E.164 number
                }));
                // Move to code verification step
                setCurrentStep(7);
            } else {
                // Map API errors to friendly messages
                let errorMessage;
                switch (result.error) {
                    case 'unauthorized':
                        errorMessage = 'Please sign in again.';
                        break;
                    case 'try_later':
                        errorMessage = 'Please wait a moment before requesting another code.';
                        break;
                    case 'phone_taken':
                        errorMessage = 'This phone number is already verified by another user.';
                        break;
                    case 'invalid_phone':
                        errorMessage = 'Please enter a valid phone number.';
                        break;
                    default:
                        errorMessage = 'Could not send verification code. Please try again.';
                }
                setPhoneError(errorMessage);
            }

        } catch (error) {
            console.error('Phone verification error:', error);
            setPhoneError('Failed to send verification code. Please try again.');
        } finally {
            setPhoneLoading(false);
        }
    };

    const verifyPhoneCode = async () => {
        try {
            setCodeLoading(true);
            setCodeError("");

            if (!formData.verification_code || formData.verification_code.length !== 6) {
                setCodeError("Please enter the 6-digit verification code");
                return;
            }

            // Get current session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setCodeError("Please log in again");
                return;
            }

            // Call verification check API
            const response = await fetch('/api/phone/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    code: formData.verification_code 
                })
            });

            const result = await response.json();

            if (result.ok) {
                setFormData(prev => ({
                    ...prev,
                    phone_verified: true
                }));
                // Allow finishing onboarding
                setCodeError("");
            } else {
                // Map API errors to friendly messages
                let errorMessage;
                switch (result.error) {
                    case 'unauthorized':
                        errorMessage = 'Please sign in again.';
                        break;
                    case 'invalid_or_expired':
                        errorMessage = "That code didn't work. Request a new one.";
                        break;
                    case 'no_phone':
                        errorMessage = 'Please start verification first.';
                        break;
                    case 'already_verified':
                        errorMessage = 'Phone is already verified.';
                        break;
                    default:
                        errorMessage = 'Could not verify your phone. Please try again.';
                }
                setCodeError(errorMessage);
            }

        } catch (error) {
            console.error('Code verification error:', error);
            setCodeError('Failed to verify code. Please try again.');
        } finally {
            setCodeLoading(false);
        }
    };

    const getCompletionButtonState = () => {
        const hasPhotos = formData.photos.length > 0;
        const hasVerifiedPhone = formData.phone_verified;
        const phoneRequired = PHONE_VERIFICATION_REQUIRED;
        const hasBio = formData.bio.trim().length >= 20;
        
        if (!hasPhotos && phoneRequired && !hasVerifiedPhone) {
            return {
                className: 'btn-warning',
                title: 'Photos and phone verification required',
                icon: AlertCircle,
                text: 'Add Photos & Verify Phone'
            };
        } else if (!hasPhotos) {
            return {
                className: 'btn-warning', 
                title: 'At least 1 photo required',
                icon: AlertCircle,
                text: 'Add Photos First'
            };
        } else if (phoneRequired && !hasVerifiedPhone) {
            return {
                className: 'btn-warning',
                title: 'Phone verification required', 
                icon: AlertCircle,
                text: 'Verify Phone First'
            };
        } else if (!hasBio) {
            return {
                className: 'btn-warning',
                title: 'Min 20 chars required for bio',
                icon: AlertCircle,
                text: 'Complete Bio'
            };
        } else {
            return {
                className: 'btn-primary',
                title: 'Ready to complete profile',
                icon: CheckCircle,
                text: 'Complete Profile'
            };
        }
    };

    const handleLocationCapture = async () => {
        setLocationLoading(true);
        setLocationError("");
        setDetectedLocation(null);
        
        try {
            // Use the utility function that handles error cases and session validation
            const coords = await saveCoordsToProfile();
            setCoordinates(coords);
            
            // Attempt reverse geocoding with error boundary
            try {
                const response = await fetch(`/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`);
                
                if (!response.ok) {
                    throw new Error('Geocoding service unavailable');
                }
                
                const geocodeData = await response.json();
                
                if (geocodeData?.ok && geocodeData.city) {
                    const locationUpdate = {
                        city: geocodeData.city,
                        state: geocodeData.state,
                        country: geocodeData.country
                    };
                    
                    // Update form data with detected location
                    setFormData(current => ({
                        ...current,
                        ...locationUpdate
                    }));
                    
                    // Show friendly location string
                    setDetectedLocation(
                        [geocodeData.city, geocodeData.state, geocodeData.country]
                            .filter(Boolean)
                            .join(', ')
                    );
                }
            } catch (geocodeError) {
                // Log but don't expose geocoding errors to user since location was already saved
                console.warn("Reverse geocoding failed:", geocodeError);
            }
        } catch (error) {
            // Location utilities provide user-friendly error messages
            setLocationError(error.message);
            console.error("Location capture error:", error);
        } finally {
            setLocationLoading(false);
        }
    };

    async function finishOnboarding(formState) {
        const authed = user ?? (await getCurrentSessionUser());
        if (!authed) {
            console.warn('[onboarding] no user; redirect to sign-in');
            navigate('/auth');
            return;
        }

        const photos = Array.isArray(formState.photos) ? formState.photos : [];

        const payload = {
            user_id: authed.id,        // REQUIRED
            email: authed.email ?? null,
            full_name: formState.full_name ?? null,
            onboarding_complete: true,
            city: formState.city ?? null,
            lat: formState.lat ?? null,
            lng: formState.lng ?? null,
            bio: formState.bio ?? null,
            photos: photos,
            gender: formState.gender ?? null,
            looking_for: formState.looking_for ?? null,
            date_of_birth: formState.date_of_birth ?? null,
            phone: formState.phone ?? null,
            phone_verified: formState.phone_verified ?? false
        };

        console.log('[Onboarding Finish] payload', payload);
        await upsertProfile(payload);
        return payload;
    }

    const handleFinishOnboarding = async () => {
        setLoading(true);
        setError("");
        
        try {
            // Validate profile data before saving
            validateOnboardingProfile({
                ...formData,
                lat: coordinates?.lat,
                lng: coordinates?.lng
            });
            
            // Complete onboarding with merged data
            await finishOnboarding({
                ...formData,
                lat: coordinates?.lat,
                lng: coordinates?.lng
            });
            
            // Redirect to /discover on success
            navigate("/discover");
            
        } catch (error) {
            const handledError = handleSupabaseError(error, 'onboarding completion');
            console.error('Onboarding completion error:', handledError);
            
            setError(handledError.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        // If we're on the final step (photos), use the finish handler
        if (currentStep === TOTAL_STEPS) {
            await handleFinishOnboarding();
            return;
        }

        // Otherwise, just advance to next step
        setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
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
                        Let&apos;s get to know you better to find your perfect match
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
                    
                    {/* Development Note */}
                    {!PHONE_VERIFICATION_REQUIRED && import.meta.env.DEV && (
                        <div className="text-center mt-2">
                            <p className="text-xs text-base-content/50 italic">
                                For testing: phone verification is disabled. We&apos;ll enable it later.
                            </p>
                        </div>
                    )}
                </div>

                {/* Main Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        
                        {/* Step 1: Name */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <User className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">What&apos;s your name?</h2>
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

                                {/* Photo Status & Instructions */}
                                <div className="bg-primary/5 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Camera className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-medium">Photo Tips</p>
                                                <div className="badge badge-primary badge-sm">
                                                    {formData.photos.length}/6 photos
                                                </div>
                                            </div>
                                            {formData.photos.length === 0 ? (
                                                <p className="text-warning font-medium mb-2">⚠️ At least 1 photo required to finish</p>
                                            ) : formData.photos.length < 3 ? (
                                                <p className="text-info mb-2">💡 Add more photos to stand out</p>
                                            ) : (
                                                <p className="text-success mb-2">✅ Great photo selection!</p>
                                            )}
                                            <ul className="text-base-content/70 space-y-1">
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
                                        We&apos;ll help you find matches nearby
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
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
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">State/Region</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.state}
                                                onChange={(e) => handleInputChange('state', e.target.value)}
                                                className="input input-bordered input-primary w-full"
                                                placeholder="State/Region"
                                                maxLength={100}
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Country</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                className="input input-bordered input-primary w-full"
                                                placeholder="Country"
                                                maxLength={100}
                                            />
                                        </div>
                                    </div>

                                    {detectedLocation && (
                                        <div className="text-sm text-base-content/60 bg-base-100 p-2 rounded border">
                                            Detected: {detectedLocation} (editable)
                                        </div>
                                    )}
                                </div>

                                {/* GPS Location Capture */}
                                <div className="divider">OR</div>
                                
                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={handleLocationCapture}
                                        disabled={locationLoading}
                                        className="btn btn-outline btn-primary w-full"
                                    >
                                        {locationLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Getting location...
                                            </>
                                        ) : (
                                            <>
                                                <Target className="w-4 h-4 mr-2" />
                                                Use my location
                                            </>
                                        )}
                                    </button>

                                    {locationError && (
                                        <div className="alert alert-error">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{locationError}</span>
                                        </div>
                                    )}

                                    {coordinates && (
                                        <div className="alert alert-success">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Location saved! ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})</span>
                                        </div>
                                    )}
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

                        {/* Step 6: Phone Number Input */}
                        {PHONE_VERIFICATION_REQUIRED && currentStep === 6 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <Phone className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">Phone Verification</h2>
                                    <p className="text-sm text-base-content/70">
                                        We&apos;ll send you a verification code for security
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Phone Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            handleInputChange('phone', e.target.value);
                                            setPhoneError("");
                                        }}
                                        className={`input input-bordered input-primary w-full ${phoneError ? 'input-error' : ''}`}
                                        placeholder="(555) 123-4567"
                                        disabled={phoneLoading}
                                    />
                                    {phoneError && (
                                        <label className="label">
                                            <span className="label-text-alt text-error">{phoneError}</span>
                                        </label>
                                    )}
                                </div>

                                <button
                                    onClick={startPhoneVerification}
                                    disabled={phoneLoading || !formData.phone.trim()}
                                    className="btn btn-primary w-full"
                                >
                                    {phoneLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending Code...
                                        </>
                                    ) : (
                                        <>
                                            Send Verification Code
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Step 7: Phone Code Verification */}
                        {PHONE_VERIFICATION_REQUIRED && currentStep === 7 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <h2 className="card-title justify-center">Verify Your Phone</h2>
                                    <p className="text-sm text-base-content/70">
                                        Enter the 6-digit code sent to {formData.phone}
                                    </p>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Verification Code</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.verification_code}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            handleInputChange('verification_code', value);
                                            setCodeError("");
                                        }}
                                        className={`input input-bordered input-primary w-full text-center text-2xl tracking-widest ${codeError ? 'input-error' : formData.phone_verified ? 'input-success' : ''}`}
                                        placeholder="123456"
                                        maxLength={6}
                                        disabled={codeLoading || formData.phone_verified}
                                    />
                                    {codeError && (
                                        <label className="label">
                                            <span className="label-text-alt text-error">{codeError}</span>
                                        </label>
                                    )}
                                    {formData.phone_verified && (
                                        <label className="label">
                                            <span className="label-text-alt text-success flex items-center">
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Phone verified successfully!
                                            </span>
                                        </label>
                                    )}
                                </div>

                                {!formData.phone_verified && (
                                    <button
                                        onClick={verifyPhoneCode}
                                        disabled={codeLoading || formData.verification_code.length !== 6}
                                        className="btn btn-primary w-full"
                                    >
                                        {codeLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="w-4 h-4 mr-2" />
                                                Verify Code
                                            </>
                                        )}
                                    </button>
                                )}

                                {formData.phone_verified && (
                                    <div className="text-center">
                                        <div className="alert alert-success">
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Your phone number has been verified! You can now complete your profile.</span>
                                        </div>
                                    </div>
                                )}

                                {!formData.phone_verified && (
                                    <div className="text-center">
                                        <button
                                            onClick={() => setCurrentStep(6)}
                                            className="btn btn-ghost btn-sm"
                                        >
                                            Wrong number? Go back
                                        </button>
                                    </div>
                                )}
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
                        {/* Hide navigation during phone verification steps since they have their own buttons */}
                        {currentStep !== 6 && currentStep !== 7 && (
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
                                        disabled={loading || formData.bio.trim().length < 20}
                                        className={`btn ${getCompletionButtonState().className}`}
                                        title={getCompletionButtonState().title}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                {(() => {
                                                    const IconComponent = getCompletionButtonState().icon;
                                                    return <IconComponent className="w-4 h-4 mr-2" />;
                                                })()}
                                                {getCompletionButtonState().text}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Special navigation for phone verification step 7 */}
                        {currentStep === 7 && (
                            <div className="flex justify-between items-center mt-8">
                                <button
                                    onClick={() => setCurrentStep(6)}
                                    className="btn btn-ghost"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </button>

                                {formData.phone_verified && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || formData.bio.trim().length < 20}
                                        className={`btn ${getCompletionButtonState().className}`}
                                        title={getCompletionButtonState().title}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                {(() => {
                                                    const IconComponent = getCompletionButtonState().icon;
                                                    return <IconComponent className="w-4 h-4 mr-2" />;
                                                })()}
                                                {getCompletionButtonState().text}
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
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
};

export default OnboardingPage;
