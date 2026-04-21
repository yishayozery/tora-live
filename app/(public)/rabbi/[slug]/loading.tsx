export default function RabbiPageLoading() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="w-32 h-32 bg-paper-soft animate-pulse rounded-full shrink-0" />
        <div className="flex-1 w-full space-y-3">
          <div className="h-9 w-64 bg-paper-soft animate-pulse rounded-btn" />
          <div className="h-4 w-full max-w-md bg-paper-soft animate-pulse rounded" />
          <div className="h-4 w-3/4 max-w-sm bg-paper-soft animate-pulse rounded" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-card border border-border bg-white p-4 text-center space-y-2">
            <div className="h-7 w-12 mx-auto bg-paper-soft animate-pulse rounded" />
            <div className="h-3 w-16 mx-auto bg-paper-soft animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-white overflow-hidden">
            <div className="h-32 bg-paper-soft animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-paper-soft animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-paper-soft animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
