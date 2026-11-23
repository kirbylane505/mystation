"use client";

/**
 * Client-only wrapper that dynamic-loads the real LiveKit-heavy StreamView.
 * Lives in a client component so `ssr: false` is legal (not allowed from a
 * server component in Next 15). Keeps the LiveKit chunks out of the first
 * load bundle and the server render for /podstation/[id].
 */

import dynamic from "next/dynamic";
import { Radio } from "lucide-react";

const StreamView = dynamic(() => import("@/components/podstation/StreamView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Radio className="w-8 h-8 text-orange-500 animate-pulse" />
    </div>
  ),
});

export default function StreamViewLazy({ stream }) {
  return <StreamView stream={stream} />;
}
