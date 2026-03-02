import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LEGAL_PAGE_LABELS, type LegalPage } from '@/types/legal';

interface LegalPageShellProps {
  activePage: LegalPage;
  title: string;
  summary: string;
  onBack: () => void;
  onNavigate: (page: LegalPage) => void;
  children: ReactNode;
}

export function LegalPageShell({
  activePage,
  title,
  summary,
  onBack,
  onNavigate,
  children,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className="flex items-center gap-2"
              >
                <img
                  src="/logo-mark.png"
                  alt="Afrexit logo"
                  className="h-11 w-11 object-contain sm:h-12 sm:w-12"
                />
                <span className="font-semibold text-black">
                  <span className="text-purple-600">Afr</span>
                  <span className="text-blue-600">exit</span>
                </span>
              </button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="border-gray-300 text-black hover:bg-gray-100"
              >
                Back
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(LEGAL_PAGE_LABELS).map(([page, label]) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onNavigate(page as LegalPage)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    activePage === page
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20 pt-40 sm:px-6 sm:pt-44">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-purple-600">
              Last Updated: March 2, 2026
            </p>
            <h1 className="mb-4 text-3xl font-bold text-black sm:text-4xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-gray-600 sm:text-[15px]">{summary}</p>

            <div className="mt-8 space-y-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
