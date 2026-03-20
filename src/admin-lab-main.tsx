import { StrictMode, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createRoot } from 'react-dom/client';
import { Loader2, LockKeyhole } from 'lucide-react';
import './index.css';
import { AdminValuationLab } from '@/sections/admin/AdminValuationLab';
import { getSupabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function AdminAuthShell() {
  const [configError] = useState(() => {
    try {
      getSupabaseClient();
      return '';
    } catch (clientError) {
      return clientError instanceof Error ? clientError.message : 'Supabase is not configured.';
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(configError);

  const supabase = useMemo(() => (configError ? null : getSupabaseClient()), [configError]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
      } else {
        setSession(data.session);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setSubmitting(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }

    setSubmitting(false);
  }

  async function handleSignOut() {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin access…
        </div>
      </div>
    );
  }

  if (session) {
    return <AdminValuationLab session={session} onSignOut={handleSignOut} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <Card className="w-full max-w-md border-slate-200 shadow-sm">
        <CardHeader className="space-y-3 border-b border-slate-200">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-700">
            <LockKeyhole className="h-3.5 w-3.5" />
            Supabase Admin Auth
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl">Admin Valuation Lab</CardTitle>
            <CardDescription>
              Sign in with an allowlisted Supabase user to access submissions, scenarios, and sensitivity testing.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="adminEmail">
                Email
              </label>
              <Input id="adminEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="adminPassword">
                Password
              </label>
              <Input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            <Button type="submit" className="w-full" disabled={submitting || !supabase}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminAuthShell />
  </StrictMode>
);
