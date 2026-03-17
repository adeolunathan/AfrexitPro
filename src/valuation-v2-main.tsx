import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FlaskConical, ShieldAlert } from 'lucide-react';
import './index.css';
import { Button } from './components/ui/button';
import { AppV2 } from './valuation-v2-app';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function LocalOnlyGuard() {
  if (LOCAL_HOSTS.has(window.location.hostname)) {
    return <AppV2 />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
          <ShieldAlert className="h-4 w-4" />
          Local-Only Lab
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            The V2 valuation lab is disabled outside localhost.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            This experimental long-form estimator is intentionally blocked on deployed domains so it cannot affect the
            public Afrexit flow while you iterate on the backend and question model.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-sm leading-7 text-slate-300">
          Run it locally at <code>http://localhost:5173/valuation-v2.html</code> while the local backend is running on{' '}
          <code>http://localhost:8788</code>.
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
            <a href="/">
              <FlaskConical className="mr-2 h-4 w-4" />
              Return to main app
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocalOnlyGuard />
  </StrictMode>
);
