import { supabase } from "./supabase";
import { getCurrentUserId } from "./auth";

function fileExtFromName(name?: string) {
  if (!name) return null;
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
}

function mimeToDefaultExt(mime?: string) {
  if (!mime) return "bin";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

// --- secure UUID helper (no Math.random fallback) ---
function secureRandomUUID(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    // RFC4122 v4: set version (0100) and variant (10xx)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return (
      hex.slice(0, 4).join("") +
      "-" +
      hex.slice(4, 6).join("") +
      "-" +
      hex.slice(6, 8).join("") +
      "-" +
      hex.slice(8, 10).join("") +
      "-" +
      hex.slice(10, 16).join("")
    );
  }
  // Fail fast rather than using insecure randomness
  throw new Error("No secure random UUID available in this environment");
}
// --- end helper ---

/**
 * Accepts a File, Blob, or a string URL.
 * - If string URL: returns it as-is (no upload).
 * - If File/Blob: uploads to 'photos' bucket under profiles/<user_id>/<uuid>.<ext> and returns the public URL.
 */
export async function uploadProfilePhoto(
  input: File | Blob | string,
): Promise<string> {
  if (typeof input === "string") {
    try {
      new URL(input);
      return input;
    } catch {
      throw new Error(
        "[uploadProfilePhoto] Received string that is not a valid URL",
      );
    }
  }

  const user_id = await getCurrentUserId();
  if (!user_id) throw new Error("[uploadProfilePhoto] No authed user");

  const name = (input as File).name; // may be undefined for Blob
  const extFromName = fileExtFromName(name || "");
  const ext = extFromName || mimeToDefaultExt((input as File | Blob).type);

  const uuid = secureRandomUUID();
  const path = `profiles/${user_id}/${uuid}.${ext}`;

  const { data, error } = await supabase.storage
    .from("photos")
    .upload(path, input, {
      cacheControl: "3600",
      upsert: false,
      contentType: (input as File | Blob).type || undefined,
    });

  if (error) {
    if ((error as any)?.statusCode === "409") {
      const retryUuid = secureRandomUUID();
      const retryPath = `profiles/${user_id}/${retryUuid}.${ext}`;
      const { data: d2, error: e2 } = await supabase.storage
        .from("photos")
        .upload(retryPath, input, {
          cacheControl: "3600",
          upsert: false,
          contentType: (input as File | Blob).type || undefined,
        });
      if (e2) {
        console.error("[uploadProfilePhoto] upload retry failed:", e2);
        throw e2;
      }
      const { data: pub2 } = supabase.storage
        .from("photos")
        .getPublicUrl(retryPath);
      return pub2.publicUrl;
    }
    console.error("[uploadProfilePhoto] upload failed:", error);
    throw error;
  }

  const { data: pub } = supabase.storage.from("photos").getPublicUrl(data.path);
  return pub.publicUrl;
}

export async function deleteUserFolder(userId: string) {
  // optional client-side cleanup; main cleanup is edge function/server
  const { data: list, error: listErr } = await supabase.storage
    .from("photos")
    .list(`profiles/${userId}`, { limit: 100, offset: 0 });

  if (listErr) throw listErr;

  if (list && list.length) {
    const paths = list.map((f) => `profiles/${userId}/${f.name}`);
    const { error: delErr } = await supabase.storage
      .from("photos")
      .remove(paths);
    if (delErr) throw delErr;
  }
}
