export default function LessonsLoading() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="h-10 w-48 mx-auto bg-paper-soft animate-pulse rounded-btn mb-3" />
        <div className="h-5 w-72 mx-auto bg-paper-soft animate-pulse rounded-btn" />
      </div>

      {/* Search bar skeleton */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="h-14 bg-paper-soft animate-pulse rounded-card" />
        <div className="mt-3 flex gap-2">
          <div className="h-11 w-32 bg-paper-soft animate-pulse rounded-full" />
          <div className="h-11 w-32 bg-paper-soft animate-pulse rounded-full" />
          <div className="h-11 w-32 bg-paper-soft animate-pulse rounded-full" />
        </div>
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-card border border-border bg-white overflow-hidden">
            <div className="h-32 bg-paper-soft animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-20 bg-paper-soft animate-pulse rounded" />
              <div className="h-5 w-3/4 bg-paper-soft animate-pulse rounded" />
              <div className="h-4 w-full bg-paper-soft animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-paper-soft animate-pulse rounded" />
              <div className="flex justify-between mt-3">
                <div className="h-3 w-16 bg-paper-soft animate-pulse rounded" />
                <div className="h-3 w-20 bg-paper-soft animate-pulse rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
