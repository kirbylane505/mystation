import dynamic from "next/dynamic";

// Global search is a 1000+ line client component with autocomplete and
// playlist mutation state. Deferring it keeps the shared baseline off the
// critical path for visitors who never hit /search.
const SearchPageClient = dynamic(() => import("./SearchPageClient"), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Loading search...
    </div>
  ),
});

export default function SearchPage() {
  return <SearchPageClient />;
}
