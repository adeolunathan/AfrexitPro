import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let cachedClient: ReturnType<typeof createClient> | null = null;

function normalizeEnvValue(value?: string) {
  return String(value || '').trim();
}

function isPlaceholderSupabaseValue(value?: string) {
  const normalized = normalizeEnvValue(value).toLowerCase();
  return (
    !normalized ||
    normalized === 'your-anon-key' ||
    normalized.includes('your-project.supabase.co')
  );
}

export function getSupabaseClient() {
  if (isPlaceholderSupabaseValue(supabaseUrl) || isPlaceholderSupabaseValue(supabaseAnonKey)) {
    throw new Error(
      'Missing real VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY for the admin lab. Keep admin dev bypass enabled for local-only testing, or add real Supabase credentials.'
    );
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedClient;
}
