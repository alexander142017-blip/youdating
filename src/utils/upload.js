import { supabase } from "../api/supabase";

export const PROFILE_PHOTO_BUCKET = "profile-photos";

export async function uploadProfilePhoto(userId, file) {
  if (!file) throw new Error("No file selected");
  if (file.size > 5 * 1024 * 1024) throw new Error("Max 5MB");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `users/${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase
    .storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(key, file, { upsert: true, cacheControl: "3600" });
  if (upErr) throw upErr;
  // public bucket → return public URL
  const { data } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(key);
  return { path: key, url: data.publicUrl };
}