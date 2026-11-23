import dynamic from 'next/dynamic';

// Admin page — isolated behind a dynamic boundary so non-admin visitors
// never download admin code. SSR is kept on because the page is a thin
// wrapper; the real admin client (Client.jsx) is streamed in asynchronously.
const Client = dynamic(() => import('./Client'), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center text-white/60">
      Loading admin console...
    </div>
  ),
});

export default function Page() {
  return <Client />;
}
