export default function FanZoneLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-white/5 rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
