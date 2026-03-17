import { ArrowRight, Database, FlaskConical, ShieldCheck } from 'lucide-react';
import { Button } from './components/ui/button';

interface V2LandingPageProps {
  onStart: () => void;
}

export function V2LandingPage({ onStart }: V2LandingPageProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_35%,_#ffffff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="Afrexit logo" className="h-12 w-12 object-contain" />
            <div className="text-lg font-semibold tracking-tight">
              <span className="text-purple">Afr</span>
              <span className="text-blue">exit</span>
            </div>
          </a>
          <div className="rounded-full border border-slate-300/80 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            Local V2 Lab
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-sm">
                <FlaskConical className="h-4 w-4" />
                Experimental long-form valuation workflow
              </div>

              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
                  Build the deeper Afrexit estimator without touching the live path.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600">
                  This lab uses a more rigorous sell-side questionnaire, a separate local backend, and an experimental
                  scoring engine so you can test the serious flow before you decide what deserves production treatment.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button onClick={onStart} className="bg-slate-950 px-6 text-white hover:bg-slate-800">
                  Start V2 questionnaire
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button asChild variant="outline" className="border-slate-300 bg-white/70 text-slate-900 hover:bg-white">
                  <a href="/valuation-v2-admin.html">Open benchmark admin</a>
                </Button>
                <Button asChild variant="outline" className="border-slate-300 bg-white/70 text-slate-900 hover:bg-white">
                  <a href="/">Open current live-style app</a>
                </Button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Database className="h-4 w-4 text-blue-600" />
                    Separate local backend
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    The V2 lab posts to <code>localhost:8788</code>, not to Google Apps Script and not to the production
                    estimator route.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Local-only guard
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    This entry is blocked outside localhost, so even if the branch gets pushed accidentally, the lab
                    will not run on a deployed domain.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 text-sm font-medium text-slate-900">Current lab scope</div>
                  <ul className="space-y-2 text-sm leading-7 text-slate-600">
                    <li>Long-form sell-side questionnaire</li>
                    <li>Experimental readiness and valuation engine</li>
                    <li>Local submission log for test runs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
