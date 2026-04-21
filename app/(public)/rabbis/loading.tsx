export default function RabbisLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <div className="h-10 w-32 bg-paper-soft animate-pulse rounded-btn mb-3" />
        <div className="h-5 w-96 bg-paper-soft animate-pulse rounded-btn" />
      </div>

      <div className="h-12 bg-paper-soft animate-pulse rounded-card mb-6" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-paper-soft animate-pulse rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-paper-soft animate-pulse rounded" />
                <div className="h-3 w-24 bg-paper-soft animate-pulse rounded" />
              </div>
            </div>
            <div className="h-3 w-full bg-paper-soft animate-pulse rounded mt-4" />
            <div className="h-3 w-3/4 bg-paper-soft animate-pulse rounded mt-2" />
          </div>
        ))}
      </div>
    </main>
  );
}
