import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // It's OK for build to continue without secrets; runtime calls will fail until env is provided.
  // Keep this file minimal and don't commit secrets.
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);