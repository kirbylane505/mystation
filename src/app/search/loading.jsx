export default function SearchLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="h-14 bg-white/10 rounded-2xl animate-pulse mb-8" />
        <div className="flex flex-wrap gap-2 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-white/10 rounded-full animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-white/10 rounded mb-1" />
                <div className="h-3 w-1/5 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
