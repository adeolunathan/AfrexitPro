import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedAdminClient;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient() {
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(
      requireEnv('SUPABASE_URL', SUPABASE_URL),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return cachedAdminClient;
}

export function getBearerToken(request) {
  const header = request.headers.authorization || request.headers.Authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return '';
  }

  return header.slice('Bearer '.length).trim();
}

export async function requireAdminSession(request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Error('Admin authentication is required.');
  }

  const supabase = getSupabaseAdminClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) {
    throw new Error('Invalid or expired admin session.');
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id, auth_user_id, email, role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle();

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (!adminUser) {
    throw new Error('You are not allowlisted for admin access.');
  }

  return {
    accessToken,
    user: authData.user,
    adminUser,
  };
}
