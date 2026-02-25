const loadingChecks = [
  'Validating response completeness',
  'Scoring sellability across the 9-factor framework',
  'Estimating valuation range and likely value',
];

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple/10 blur-3xl" />
        <div className="absolute top-40 right-6 h-56 w-56 rounded-full bg-blue/10 blur-3xl" />
        <div className="absolute bottom-12 left-4 h-56 w-56 rounded-full bg-purple/5 blur-3xl" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo-mark.png"
                alt="Afrexit logo"
                className="w-10 h-10 object-contain shrink-0"
              />
              <span className="font-semibold text-black text-lg">
                <span className="text-purple">Afr</span>
                <span className="text-blue">Exit</span>
              </span>
            </div>
            <div className="hidden sm:block text-xs text-gray-500">
              Preparing your valuation report
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex-1 pt-28 pb-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-gray-200 bg-white/95 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple via-blue to-purple bg-[length:200%_100%] animate-[afrexit-shimmer_2.8s_linear_infinite]" />

            <div className="p-6 sm:p-8">
              <div className="grid gap-7 md:grid-cols-[auto_1fr] md:items-center">
                <div className="flex justify-center">
                  <div className="relative h-28 w-28">
                    <div className="absolute inset-0 rounded-full bg-purple/20 blur-xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full border border-purple/20 bg-white" />
                    <div
                      className="absolute inset-0 rounded-full animate-spin"
                      style={{
                        background:
                          'conic-gradient(from 180deg, rgba(160,32,240,0.08) 0deg, #A020F0 110deg, #0070F3 230deg, rgba(0,112,243,0.08) 360deg)',
                      }}
                    />
                    <div className="absolute inset-[7px] rounded-full bg-white border border-gray-100" />
                    <div className="absolute inset-0 grid place-items-center">
                      <img
                        src="/logo-mark.png"
                        alt="Afrexit logo"
                        className="h-10 w-10 object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-purple/20 bg-purple/5 px-3 py-1 text-xs font-semibold text-purple mb-3">
                    Valuation in progress
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-black leading-tight">
                    Calculating your business valuation
                  </h1>
                  <p className="text-gray-600 mt-3 max-w-2xl">
                    We are analyzing your responses across financial quality, transferability, and buyer readiness to produce your estimated valuation range.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This usually takes about 10–15 seconds.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-[1.25fr_1fr]">
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 sm:p-5">
                  <div className="text-sm font-semibold text-black mb-3">What we are checking right now</div>
                  <div className="space-y-3">
                    {loadingChecks.map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-lg border border-white bg-white/80 px-3 py-2"
                      >
                        <div className="relative h-5 w-5 shrink-0">
                          <div
                            className="absolute inset-0 rounded-full bg-purple/15"
                            style={{ animationDelay: `${index * 180}ms` }}
                          />
                          <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple to-blue animate-pulse" />
                        </div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                  <div className="text-sm font-semibold text-black mb-4">Progress indicator</div>
                  <div className="space-y-4">
                    {[72, 84, 66].map((width, idx) => (
                      <div key={idx}>
                        <div className="mb-1 text-xs text-gray-500">
                          {idx === 0 && 'Data quality scoring'}
                          {idx === 1 && 'Transferability assessment'}
                          {idx === 2 && 'Valuation range calibration'}
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple to-blue"
                            style={{
                              width: `${width}%`,
                              animation: `afrexit-breathe 1.8s ease-in-out ${idx * 120}ms infinite`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Do not close this tab while we generate your result.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes afrexit-shimmer {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }

        @keyframes afrexit-breathe {
          0%, 100% { opacity: 0.85; transform: scaleX(1); }
          50% { opacity: 1; transform: scaleX(0.96); }
        }
      `}</style>
    </div>
  );
}
