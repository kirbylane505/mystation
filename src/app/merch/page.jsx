import dynamic from "next/dynamic";

// The merch page is a very large (~1500 line) client component. Even with
// default (SSR-on) dynamic import the chunk still gets emitted as its own
// bundle so Next can stream it; keeping SSR on preserves SEO for the product
// grid (layout.jsx already exports metadata + JSON-LD).
const MerchPageClient = dynamic(() => import("./MerchPageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Loading merch...
    </div>
  ),
});

export default function MerchPage() {
  return <MerchPageClient />;
}
