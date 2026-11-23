import dynamic from "next/dynamic";

// Lounge lobby pulls in GameSelector + RoomBrowser + OnlineUsers + chat state.
// Most visitors never open the lounge, so load the lobby on demand.
const LoungePageClient = dynamic(() => import("./LoungePageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Opening the lounge...
    </div>
  ),
});

export default function LoungePage() {
  return <LoungePageClient />;
}
