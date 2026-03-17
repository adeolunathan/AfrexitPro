import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldAlert } from 'lucide-react';
import './index.css';
import { Button } from './components/ui/button';
import { V2AdminPage } from './valuation-v2-admin-page';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function LocalOnlyGuard() {
  if (LOCAL_HOSTS.has(window.location.hostname)) {
    return <V2AdminPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-300">
          <ShieldAlert className="h-4 w-4" />
          Local-Only Admin
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-white">The V2 admin view is disabled outside localhost.</h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            This benchmark and calibration review surface is for local model iteration only.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
            <a href="/valuation-v2.html">Open V2 lab</a>
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
