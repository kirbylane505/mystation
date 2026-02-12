export default function Loading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/10 rounded-xl mb-3" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-1" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
