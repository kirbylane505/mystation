export default function LoungeLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-8 w-56 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded animate-pulse mx-auto" />
        </div>
        <div className="flex gap-4 justify-center mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-20 h-20 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
