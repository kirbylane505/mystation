/**
 * MYSTATION - The Cubist Artist Page
 * Tyrell Thornton — 100M+ streams/views, BET+ S2, major credits
 */

import Link from 'next/link';
import CubistPlayer from '@/components/CubistPlayer';

export const metadata = {
  title: 'The Cubist - Tyrell Thornton | MyStation',
  description: 'The Cubist (Tyrell Thornton) — 100M+ streams & views. Credits: French Montana, Max B, Big30, Pooh Shiesty, Blac Youngsta. BET+ "I Got a Story to Tell" Season 2.',
  openGraph: {
    title: 'THE CUBIST — 100M+ Streams. BET+. The Sound Behind The Stars.',
    description: 'Tyrell Thornton aka The Cubist — producer for French Montana, Max B, Big30, Pooh Shiesty & Blac Youngsta. Stream his beats, watch his videos, and catch Season 2 on BET+.',
    url: 'https://mystationlive.com/artists/the-cubist',
    siteName: 'MyStation',
    images: [{ url: 'https://img.youtube.com/vi/u9rdzKwhxhI/maxresdefault.jpg', width: 1280, height: 720, alt: 'The Cubist — Coke Wave 3.5 Narcos' }],
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE CUBIST — 100M+ Streams. The Sound Behind The Stars.',
    description: 'Producer for French Montana, Max B, Big30 & more. Stream beats + catch BET+ Season 2.',
    images: ['https://img.youtube.com/vi/u9rdzKwhxhI/maxresdefault.jpg'],
  },
};

const CREDITS = [
  { artist: 'French Montana', role: 'Production' },
  { artist: 'Max B', role: 'Production' },
  { artist: 'Big30', role: 'Production' },
  { artist: 'Pooh Shiesty', role: 'Production' },
  { artist: 'Blac Youngsta', role: 'Production' },
];

const MILESTONES = [
  { stat: '100M+', label: 'Streams & Views' },
  { stat: 'BET+', label: '"I Got a Story to Tell" S2' },
  { stat: 'April 2026', label: 'Season 2 Premiere' },
  { stat: '5+', label: 'Major Artist Credits' },
];

export default function CubistPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/60 via-red-900/40 to-black" />
        <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6">
            <span className="text-amber-400 text-sm font-medium">IDMG Producer</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white mb-4">
            THE <span className="bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">CUBIST</span>
          </h1>
          <p className="text-xl text-white/60 mb-2">Tyrell Thornton</p>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">
            Producer, artist, and creative visionary behind 100M+ streams. From the studio to BET+, The Cubist is building a legacy in music and media.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {MILESTONES.map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent mb-1">{m.stat}</p>
                <p className="text-white/50 text-sm">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-black text-white mb-6">About The Cubist</h2>
          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              The Cubist is a multi-faceted creative force in hip-hop and entertainment. With over 100 million streams and views across platforms, he has established himself as one of the most prolific producers in the game.
            </p>
            <p>
              His production credits read like a who{"'"}s who of hip-hop royalty — French Montana, Max B, Big30, Pooh Shiesty, and Blac Youngsta have all tapped into The Cubist{"'"}s signature sound. His beats blend cinematic atmosphere with hard-hitting drums, creating the perfect backdrop for storytelling.
            </p>
            <p>
              In April 2026, The Cubist expands into television with Season 2 of <strong className="text-white">{'"'}I Got a Story to Tell{'"'}</strong> on BET+. The docuseries dives deep into the untold stories behind the music, showcasing The Cubist{"'"}s journey from the trenches to the top of the industry.
            </p>
            <p>
              As a core member of the IDMG family, The Cubist continues to push boundaries and elevate the culture through music, media, and community.
            </p>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="py-16 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-black text-white mb-8">Major Credits</h2>
          <div className="space-y-4">
            {CREDITS.map((c, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-white/5 last:border-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold">{c.artist}</p>
                  <p className="text-white/40 text-sm">{c.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Works */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-black text-white mb-8">Recent Works</h2>

          {/* YouTube Video - Ever Since U Left Me (Official Video) */}
          <div className="mb-10">
            <div className="aspect-video rounded-2xl overflow-hidden mb-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/u9rdzKwhxhI"
                title="French Montana x Max B - Ever Since U Left Me (Official Video)"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <h3 className="text-xl font-bold text-white">Ever Since U Left Me</h3>
            <p className="text-white/50">French Montana x Max B — Prod. The Cubist</p>
          </div>

          {/* YouTube Video - Pop The Half */}
          <div className="mb-10">
            <div className="aspect-video rounded-2xl overflow-hidden mb-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/oGjgMMP6wMY"
                title="French Montana x Max B - Pop The Half (Prod. The Cubist)"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <h3 className="text-xl font-bold text-white">Pop The Half</h3>
            <p className="text-white/50">French Montana & Max B — Prod. The Cubist</p>
            <p className="text-white/30 text-xs mt-1">From <em>Coke Wave 3.5: Narcos</em></p>
          </div>
        </div>
      </section>

      {/* My Work — iDMG Coke Wave Beats */}
      <section className="py-16 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-black text-white mb-2">My Work</h2>
          <p className="text-white/40 mb-8">iDMG Coke Wave Beats — Produced by The Cubist</p>
          <CubistPlayer />
        </div>
      </section>

      {/* BET+ Feature */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="glass rounded-3xl p-8 lg:p-12 border border-amber-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-red-500/5" />
            <div className="relative text-center">
              <p className="text-amber-400 text-sm font-bold uppercase tracking-wider mb-3">Coming April 2026</p>
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">
                {'"'}I Got a Story to Tell{'"'} <br />
                <span className="text-amber-400">Season 2</span>
              </h3>
              <p className="text-white/50 max-w-xl mx-auto mb-8">
                The highly anticipated second season on BET+ follows The Cubist deeper into the music industry, featuring never-before-seen footage and exclusive behind-the-scenes stories.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 font-bold">
                Streaming on BET+
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h3 className="text-xl font-bold text-white mb-6">Hear The Cubist{"'"}s Production on MyStation</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/music" className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-red-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105">
              Stream Now
            </Link>
            <Link href="/merch" className="px-8 py-3.5 bg-white/10 text-white font-bold rounded-full hover:bg-white/15 transition-all hover:scale-105">
              Shop Merch
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
