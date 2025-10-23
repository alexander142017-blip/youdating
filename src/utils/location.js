import { supabase } from "../api/supabase";

export async function getCoords(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    
    const onOk = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords || {};
      resolve({ lat, lng });
    };
    
    const onErr = (err) => reject(new Error(err?.message || "Location error"));
    
    navigator.geolocation.getCurrentPosition(onOk, onErr, { 
      enableHighAccuracy: true, 
      timeout: timeoutMs, 
      maximumAge: 0 
    });
  });
}

export async function saveCoordsToProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not signed in");
  
  const { lat, lng } = await getCoords();
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
      lat, 
      lng, 
      location_updated_at: new Date().toISOString() 
    })
    .eq("user_id", userId);
    
  if (error) throw error;
  return { lat, lng };
}