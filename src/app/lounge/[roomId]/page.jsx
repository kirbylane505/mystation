import dynamic from "next/dynamic";

// Thin route shell — the real client, and the ~70 KB GameRoom bundle it
// uses, load after navigation so initial transition is fast.
const RoomPageClient = dynamic(() => import("./RoomPageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Joining room...
    </div>
  ),
});

export default function RoomPage() {
  return <RoomPageClient />;
}
