import { useState, useEffect } from "react";
import { User, Edit, Settings, Camera, MapPin, CheckCircle, Loader2, Target, AlertCircle } from "lucide-react";
import { getCurrentSessionUser } from "../api/auth";
import { upsertProfile } from "../api/profiles";
import { saveCoordsToProfile } from "../utils/location";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [, setCoordinates] = useState(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    age: '',
    show_on_discover: true,
    show_distance: true,
    show_age: true
  });

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current user (auth only)
      const user = await getCurrentSessionUser();
      
      if (!user) {
        setError('No authenticated user found');
        return;
      }
      
      // Initialize profile with user data
      const combinedProfile = {
        ...user,
        email: user.email,
        user_id: user.id
      };
      
      setProfile(combinedProfile);
      
      // Populate form with existing data
      setFormData({
        name: combinedProfile.name || combinedProfile.user_metadata?.name || '',
        city: combinedProfile.city || '',
        bio: combinedProfile.bio || '',
        age: combinedProfile.age || '',
        show_on_discover: combinedProfile.show_on_discover ?? true,
        show_distance: combinedProfile.show_distance ?? true,
        show_age: combinedProfile.show_age ?? true
      });
      
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const authed = await getCurrentSessionUser();
      if (!authed) {
        setError('Please sign in to continue');
        return;
      }

      // Prepare profile data for upsert
      const profileUpdate = {
        user_id: authed.id,        // REQUIRED
        email: authed.email ?? null,
        full_name: formData.name,
        city: formData.city ?? null,
        bio: formData.bio ?? null,
        age: formData.age ? parseInt(formData.age) : null,
        show_on_discover: formData.show_on_discover ?? true,
        show_distance: formData.show_distance ?? true,
        show_age: formData.show_age ?? true,
        updated_at: new Date().toISOString()
      };

      // Save to Supabase
      const updatedProfile = await upsertProfile(profileUpdate);
      
      // Update local state
      setProfile({ ...profile, ...updatedProfile });
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLocationCapture = async () => {
    setLocationLoading(true);
    setLocationError("");
    setError("");
    
    try {
      const coords = await saveCoordsToProfile();
      setCoordinates(coords);
      // Reload profile to get updated location
      await loadUserProfile();
      setSuccessMessage('Location updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const msg = error?.message || "Could not get your location";
      setLocationError(msg);
      console.error("Location capture error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadUserProfile}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full text-white shadow-lg">
            <User className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-xl text-gray-600">
          View and edit your details to make a great impression
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Preview */}
        <div className="card bg-base-100 shadow-xl overflow-hidden">
          <figure className="bg-gradient-to-br from-primary/10 to-warning/10 h-64">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <p className="text-lg font-medium">Profile Photo</p>
              <button className="btn btn-primary btn-sm mt-2">
                Upload Photo
              </button>
            </div>
          </figure>
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-2xl">
                {formData.name || 'Your Name'}{formData.age ? `, ${formData.age}` : ''}
              </h3>
              <button className="btn btn-ghost btn-sm text-primary">
                <Edit className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-base-content/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{formData.city || 'Your City'}</span>
              </div>
              {profile?.email && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{profile.email}</span>
                </div>
              )}
            </div>
            <p className="text-base-content/70 mt-4">
              {formData.bio || 'Write something interesting about yourself here...'}
            </p>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-primary" />
                <h3 className="card-title">Profile Settings</h3>
              </div>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Display Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input input-bordered input-primary w-full"
                    placeholder="Enter your name"
                  />
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
                  />
                </div>

                {/* GPS Location Capture */}
                <div className="space-y-3">
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

                  {profile?.lat && profile?.lng && (
                    <div className="alert alert-info">
                      <MapPin className="w-4 h-4" />
                      <span>Location: {profile.lat.toFixed(4)}, {profile.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Age</span>
                  </label>
                  <input 
                    type="number" 
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="input input-bordered input-primary w-full"
                    placeholder="Enter your age"
                    min="18"
                    max="100"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="textarea textarea-bordered textarea-primary w-full h-24 resize-none"
                    placeholder="Tell people about yourself..."
                  />
                </div>
                
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy & Safety</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Show me on Discover</span>
                <input 
                  type="checkbox" 
                  checked={formData.show_on_discover}
                  onChange={(e) => handleInputChange('show_on_discover', e.target.checked)}
                  className="w-5 h-5 text-pink-600" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Show distance</span>
                <input 
                  type="checkbox" 
                  checked={formData.show_distance}
                  onChange={(e) => handleInputChange('show_distance', e.target.checked)}
                  className="w-5 h-5 text-pink-600" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Show age</span>
                <input 
                  type="checkbox" 
                  checked={formData.show_age}
                  onChange={(e) => handleInputChange('show_age', e.target.checked)}
                  className="w-5 h-5 text-pink-600" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}