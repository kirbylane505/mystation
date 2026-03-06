'use client';

export function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />;
}

export function TrackSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
          <SkeletonPulse className="w-10 h-10 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
          <SkeletonPulse className="w-10 h-3" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <SkeletonPulse className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full aspect-[16/7] md:aspect-[16/5]">
      <SkeletonPulse className="w-full h-full rounded-none" />
    </div>
  );
}
