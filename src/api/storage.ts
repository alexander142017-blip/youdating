import { supabase } from './supabase';

const BUCKET = 'profile-photos';

function extFromName(name: string) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i) : '';
}

export async function uploadProfilePhoto(file: File, userId: string) {
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
  const filename = `${Date.now()}-${safeName}`;
  const path = `users/${userId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || `image/${extFromName(file.name).replace('.', '')}`,
    });

  if (uploadError) {
    console.error('[UPLOAD photo] error:', uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrlData.publicUrl; // string URL
}

export async function deleteUserFolder(userId: string) {
  // optional client-side cleanup; main cleanup is edge function/server
  const { data: list, error: listErr } = await supabase
    .storage.from(BUCKET)
    .list(`users/${userId}`, { limit: 100, offset: 0 });

  if (listErr) throw listErr;

  if (list && list.length) {
    const paths = list.map(f => `users/${userId}/${f.name}`);
    const { error: delErr } = await supabase.storage.from(BUCKET).remove(paths);
    if (delErr) throw delErr;
  }
}