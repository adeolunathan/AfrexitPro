import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_DEV_BYPASS = /^true$/i.test(String(process.env.ADMIN_DEV_BYPASS || ''));

let cachedAdminClient;

function requireEnv(name, value) {
  if (!isMeaningfulSupabaseEnvValue(value)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeEnvValue(value) {
  return String(value || '').trim();
}

function isPlaceholderSupabaseValue(value) {
  const normalized = normalizeEnvValue(value).toLowerCase();
  return (
    !normalized ||
    normalized === 'your-anon-key' ||
    normalized === 'your-service-role-key' ||
    normalized.includes('your-project.supabase.co')
  );
}

function isMeaningfulSupabaseEnvValue(value) {
  return Boolean(normalizeEnvValue(value)) && !isPlaceholderSupabaseValue(value);
}

function isLocalSupabaseUrl(value) {
  return /^https?:\/\/(?:127\.0\.0\.1|localhost):54321\/?$/i.test(normalizeEnvValue(value));
}

export function getSupabaseMode() {
  if (!isMeaningfulSupabaseEnvValue(SUPABASE_URL) || !isMeaningfulSupabaseEnvValue(SUPABASE_SERVICE_ROLE_KEY)) {
    return 'disabled';
  }

  return isLocalSupabaseUrl(SUPABASE_URL) ? 'local' : 'hosted';
}

export function isSupabaseConfigured() {
  return getSupabaseMode() !== 'disabled';
}

export function isAdminDevBypassEnabled() {
  return ADMIN_DEV_BYPASS;
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
  if (ADMIN_DEV_BYPASS) {
    return {
      accessToken: 'local-admin-dev-bypass',
      user: {
        id: 'local-admin-dev-bypass',
        email: 'local-admin@localhost',
      },
      adminUser: {
        id: 'local-admin-dev-bypass',
        auth_user_id: 'local-admin-dev-bypass',
        email: 'local-admin@localhost',
        role: 'admin',
      },
    };
  }

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
