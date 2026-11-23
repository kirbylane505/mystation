import dynamic from "next/dynamic";

// Videos hub imports a VideoPlayer + full catalog state — dynamic-load so
// anyone who doesn't visit /videos doesn't pay for the player chunk.
const VideosPageClient = dynamic(() => import("./VideosPageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Loading videos...
    </div>
  ),
});

export default function VideosPage() {
  return <VideosPageClient />;
}
