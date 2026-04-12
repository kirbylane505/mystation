import Link from 'next/link';

export const metadata = {
  title: 'Become a Creator | MyStation',
  description: 'Build your station. Go live, sell merch, grow your audience. $14.99/mo.',
};

const FEATURES = [
  { title: 'Go Live', desc: 'Stream to 1000+ viewers. Workouts, sets, cooking, whatever you do.', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
  { title: 'Upload Content', desc: 'Music, videos, mixes, tutorials — your station, your content.', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { title: 'Sell Merch', desc: 'Upload designs, we handle printing & shipping. You keep 100%.', icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' },
  { title: 'Build Followers', desc: 'Fans follow for free. Push alerts when you go live or drop new content.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { title: 'Your Station', desc: 'Public profile with everything you do. Customize it your way.', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2' },
  { title: 'Get Paid', desc: 'Revenue hits your bank via Stripe Connect. No delays.', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
];

const CATEGORIES = ['Musicians', 'Podcasters', 'DJs', 'Fitness Trainers', 'Barbers', 'Chefs', 'Artists', 'Educators', 'Comedians', 'Models'];

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
          Your Station.{' '}
          <span className="text-[#D4AF37]">Your Way.</span>
        </h1>
        <p className="text-xl text-[#a1a1aa] mb-2">
          {CATEGORIES.join(' \u00B7 ')}
        </p>
        <p className="text-lg text-[#71717a] mb-8">
          $14.99/mo. Go live, upload content, sell merch, build your following. Whatever you do — build it here.
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
            { step: '3', title: 'Build Your Station', desc: 'Upload content, go live, sell merch — whatever fits your craft' },
            { step: '4', title: 'Grow Your Following', desc: 'Fans follow for free. Push alerts bring them back every time.' },
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
          Join MyStation, $14.99/mo
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center text-[#52525b] text-sm border-t border-[#27272a]">
        <p>MyStation. Where Creators Thrive.</p>
      </footer>
    </div>
  );
}
