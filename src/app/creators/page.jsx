import Link from 'next/link';

export const metadata = {
  title: 'Become a Creator — MyStation',
  description: 'Upload music, sell merch, build your audience. $14.99/mo. Keep 100% of merch revenue.',
};

const FEATURES = [
  { title: 'Upload Music', desc: "Your tracks on MyStation's catalog. Fans discover you.", icon: 'M9 19V6l12-3v13' },
  { title: 'Sell Merch', desc: 'Upload designs, we handle printing & shipping. You keep 100%.', icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' },
  { title: 'Analytics', desc: 'See plays, fans, top tracks, revenue — all in one dashboard.', icon: 'M18 20V10M12 20V4M6 20v-6' },
  { title: 'Your Profile', desc: 'Public artist page with music, merch, bio, and social links.', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' },
  { title: 'Zero Ops', desc: 'We handle fulfillment, hosting, streaming. You just create.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8' },
  { title: 'Get Paid', desc: 'Merch revenue hits your bank via Stripe Connect. No delays.', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
];

const CATEGORIES = ['Musicians', 'Podcasters', 'Producers', 'DJs', 'Content Creators'];

function Icon({ d }) {
  return (
    <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

export default function CreatorsLanding() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Hero */}
      <section className="px-4 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Your Music. Your Merch.{' '}
          <span className="text-[#D4AF37]">Your Platform.</span>
        </h1>
        <p className="text-xl text-[#a1a1aa] mb-2">
          {CATEGORIES.join(' \u00B7 ')}
        </p>
        <p className="text-lg text-[#71717a] mb-8">
          $14.99/mo — Upload music, sell merch, build your audience. Keep 100% of merch revenue.
        </p>
        <Link
          href="/creators/signup"
          className="inline-block px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-lg hover:bg-[#b8962e] transition-all"
        >
          Start Creating
        </Link>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
              <div className="mb-3"><Icon d={f.icon} /></div>
              <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
              <p className="text-[#a1a1aa] text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
        <div className="space-y-6">
          {[
            { step: '1', title: 'Sign Up', desc: 'Create your account and pay $14.99/mo' },
            { step: '2', title: 'Connect Your Bank', desc: 'Link via Stripe so merch payouts hit your account' },
            { step: '3', title: 'Upload & Sell', desc: 'Add tracks, create merch, customize your profile' },
            { step: '4', title: 'Get Discovered', desc: 'Fans find you on MyStation. You keep 100% of merch sales.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-4 text-left">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center flex-shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="text-white font-bold">{s.title}</h3>
                <p className="text-[#a1a1aa] text-sm">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/creators/signup"
          className="inline-block mt-10 px-8 py-4 bg-[#D4AF37] text-black font-bold text-lg rounded-lg hover:bg-[#b8962e] transition-all"
        >
          Join MyStation — $14.99/mo
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-[#52525b] text-sm border-t border-[#27272a]">
        <p>MyStation — Where Creators Thrive</p>
      </footer>
    </div>
  );
}
