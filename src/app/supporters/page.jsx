import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 300; // cache 5 minutes

function displayName(row) {
  if (row.email) return row.email.split('@')[0];
  if (row.phone) return `fan-${row.phone.slice(-4)}`;
  return 'Supporter';
}

export default async function SupportersPage() {
  let supporters = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      const { data } = await supabase
        .from('subscribers')
        .select('email, phone, created_at')
        .eq('tier', 'premium')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(500);
      supporters = data || [];
    }
  } catch (err) {
    console.error('[supporters] query failed:', err);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-white">
      <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
      <h1 className="text-4xl md:text-5xl font-black mt-4 mb-2">Supporters Wall</h1>
      <p className="text-white/60 mb-8">
        Every Premium member keeping the station alive. Thank you.
      </p>

      {supporters.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl p-8 text-center border border-white/10">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-xl font-black mb-2">Be first on the wall</h2>
          <p className="text-white/60 mb-6">Premium supporters get their name up here forever.</p>
          <Link
            href="/premium"
            className="inline-block px-8 py-3 bg-yellow-400 text-black rounded-full font-black hover:bg-yellow-300 transition"
          >
            Become a Supporter — $4.99/mo
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {supporters.map((s, i) => (
              <div
                key={i}
                className="bg-neutral-900 rounded-lg p-3 text-sm border border-white/10"
              >
                <div className="font-bold text-yellow-400 truncate">🏆 {displayName(s)}</div>
                <div className="text-white/40 text-xs mt-1">
                  since {new Date(s.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/premium"
              className="inline-block px-8 py-3 bg-yellow-400 text-black rounded-full font-black hover:bg-yellow-300 transition"
            >
              Join the Wall — $4.99/mo
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
