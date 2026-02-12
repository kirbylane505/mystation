export default function MusicLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero skeleton */}
        <div className="h-64 bg-white/5 rounded-3xl animate-pulse mb-8" />

        {/* Featured section */}
        <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/10 rounded-xl mb-2" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-1" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* All songs section */}
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-white/10 rounded mb-1" />
                <div className="h-3 w-1/5 bg-white/5 rounded" />
              </div>
              <div className="h-3 w-10 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
