import { supabase } from '../api/supabase';
import { validateUserSession, executeWithErrorHandling } from './rlsErrorHandler';
import { upsertProfile } from '@/api/profiles';

export async function getCoords(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Location services are not supported by this browser'));
    }

    // Check if permissions are blocked
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        if (permission.state === 'denied') {
          return reject(new Error('Location access denied. Please enable location permissions in your browser settings.'));
        }
      }).catch(() => {
        // Permissions API not supported, continue with geolocation attempt
      });
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (err) => {
        let message = 'Unable to get your location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions and try again.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please check your connection and try again.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
          default:
            message = err?.message || 'Location error occurred';
        }
        reject(new Error(message));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 300000 } // Cache for 5 minutes
    );
  });
}

export async function saveCoordsToProfile() {
  return executeWithErrorHandling(async () => {
    const userId = await validateUserSession(supabase);
    const { lat, lng } = await getCoords();
    
    // Validate coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid location coordinates received');
    }
    
    await upsertProfile({
      user_id: userId,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
    
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  }, 'location save');
}