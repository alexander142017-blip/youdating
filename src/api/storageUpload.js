import { supabase } from './supabase';

// Minimal mime -> extension fallback
const mimeToExt = (mime = '') => {
  const m = String(mime).toLowerCase();
  if (m.includes('jpeg')) return 'jpg';
  if (m.includes('jpg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('gif')) return 'gif';
  if (m.includes('webp')) return 'webp';
  if (m.includes('heic')) return 'heic';
  return 'jpg';
};

// Make a unique-ish id for filenames
const rid = () => Math.random().toString(36).slice(2, 10);

/**
 * Upload ONE photo (File | Blob | http URL | data URL) to the given bucket/user folder.
 * Returns a public URL string. If input is already an http(s) URL, returns it unchanged.
 */
export async function uploadOnePhoto(input, userId, bucket = 'profile-photos') {
  if (!userId) throw new Error('[storage.uploadOnePhoto] Missing userId');
  if (!input) throw new Error('[storage.uploadOnePhoto] No input provided');

  // If it's already a web URL, don't re-upload—just keep it
  if (typeof input === 'string' && /^https?:\/\//i.test(input)) {
    return input;
  }

  // If it's a data URL, convert to Blob
  let fileOrBlob = input;
  if (typeof input === 'string' && input.startsWith('data:')) {
    const [meta, b64] = input.split(',');
    const mime = meta.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const bin = atob(b64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    fileOrBlob = new Blob([bytes], { type: mime });
  }

  // Derive extension safely
  let ext = 'jpg';
  // Case 1: File with name
  const maybeName = typeof File !== 'undefined' && fileOrBlob instanceof File ? fileOrBlob.name : '';
  if (maybeName && maybeName.includes('.')) {
    ext = maybeName.split('.').pop().toLowerCase();
  } else if (fileOrBlob && fileOrBlob.type) {
    // Case 2: Blob with type
    ext = mimeToExt(fileOrBlob.type);
  } else if (typeof input === 'string') {
    // Case 3: URL/path string without http (rare)
    const m = input.match(/\.([a-z0-9]+)$/i);
    if (m) ext = m[1].toLowerCase();
  }

  const path = `${userId}/${Date.now()}-${rid()}.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(path, fileOrBlob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('[storage.uploadOnePhoto] upload error:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  const publicUrl = data?.publicUrl;
  if (!publicUrl) {
    throw new Error('[storage.uploadOnePhoto] Could not resolve public URL');
  }
  return publicUrl;
}

/**
 * Upload many inputs; filters out falsy entries; returns array of public URLs.
 */
export async function uploadManyPhotos(inputs, userId, bucket = 'profile-photos') {
  const list = Array.isArray(inputs) ? inputs.filter(Boolean) : [inputs].filter(Boolean);
  const out = [];
  for (const item of list) {
    try {
      const url = await uploadOnePhoto(item, userId, bucket);
      out.push(url);
    } catch (e) {
      console.warn('[storage.uploadManyPhotos] skipping failed item:', e);
    }
  }
  return out;
}