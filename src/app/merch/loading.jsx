export default function MerchLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mx-auto" />
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-white/10 rounded-2xl mb-3" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-5 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
