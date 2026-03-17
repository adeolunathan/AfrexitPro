export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black">Analyzing Your Business</h1>
          <p className="text-base leading-7 text-gray-600">
            We are evaluating your responses against industry benchmarks and market data to calculate your business valuation.
          </p>
        </div>
      </div>
    </div>
  );
}
