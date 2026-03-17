export function V2LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-white" />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Running the local V2 engine</h1>
          <p className="text-base leading-7 text-slate-300">
            The submission is being scored by your experimental local backend. Nothing is being sent to the live
            Afrexit estimator flow.
          </p>
        </div>
      </div>
    </div>
  );
}
