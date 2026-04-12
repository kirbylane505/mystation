/**
 * MYSTATION - About / Foundation Page
 * Mike Page Foundation - Proud Partner of MyStation
 * Updated: Feb 6, 2026
 * Converted to React Server Component — no client hooks needed
 */

import { artistInfo } from '@/data/tracks';
import Image from 'next/image';
import { Heart, Music, Award, Users, MapPin, Calendar, ExternalLink, Check, HeartHandshake, Utensils } from 'lucide-react';

export const metadata = {
  title: 'About | Mike Page Foundation',
  description: 'Mike Page Foundation, a 501(c)(3) nonprofit (EIN: 41-3820708). Youth music programs, scholarships, community meals, and Love on the Lawn Festival. Building community through music.',
  alternates: { canonical: 'https://mystationlive.com/about' },
  openGraph: {
    title: 'About | Mike Page Foundation | 501(c)(3) Nonprofit',
    description: 'Mike Page Foundation, a 501(c)(3) nonprofit (EIN: 41-3820708). Youth music programs, scholarships, community meals, and the Love on the Lawn Festival.',
    url: 'https://mystationlive.com/about',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Mike Page Foundation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About | Mike Page Foundation',
    description: '501(c)(3) nonprofit (EIN: 41-3820708). Youth music programs, scholarships, community meals, and the Love on the Lawn Festival.',
    images: ['/images/og-image.png'],
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mystation-gold/10 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-mystation-gold/5 rounded-full blur-3xl" />

        <div className="relative max-w-screen-xl mx-auto px-6 text-center">
          <div className="foundation-badge mb-6 inline-flex items-center gap-2">
            <Heart size={14} className="text-mystation-gold" />
            501(c)(3) Nonprofit Organization | EIN: 41-3820708
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Mike Page <span className="text-mystation-gold">Foundation</span>
          </h1>

          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-4">
            A Proud Partner of MyStation
          </p>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Building community. Giving back. Uniting people through music.
            <span className="block mt-2 text-mystation-gold font-semibold">100% dedicated to changing the world, one community at a time.</span>
          </p>

                  </div>
      </div>

      {/* Mission */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-white/70 text-lg mb-6">
              The Mike Page Foundation, a 501(c)(3) nonprofit (EIN: 41-3820708), was created to give back to the community that shaped us.
              Based in Elgin, Illinois, we believe every young person deserves access to music,
              education, and opportunity.
            </p>
            <p className="text-white/70 text-lg">
              When you support MyStation, you help the Mike Page Foundation (EIN: 41-3820708) fund youth music programs,
              provide scholarships, and host community events that bring people together.
              We're not just making music—we're building a movement.
            </p>
          </div>

          <div className="glass rounded-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Your Donation Supports:</h3>
            <ul className="space-y-4">
              {[
                'Instruments and music lessons for underserved youth',
                'College scholarships for aspiring artists',
                'Love on the Lawn annual community festival',
                'Local family assistance programs',
                'Music education in schools',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-mystation-gold/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} className="text-mystation-gold" />
                  </div>
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="bg-mystation-accent/30 py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Programs</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-mystation-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music size={32} className="text-mystation-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Youth Music Program</h3>
              <p className="text-white/60 text-sm">
                Free instruments and lessons for kids who can't afford them.
                Building the next generation of artists.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-mystation-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={32} className="text-mystation-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Scholarships</h3>
              <p className="text-white/60 text-sm">
                Annual scholarships for students pursuing music, arts,
                and education. Investing in our future leaders.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-mystation-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-mystation-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Love on the Lawn</h3>
              <p className="text-white/60 text-sm">
                Annual Hip-Hop/R&B festival in Elgin, IL. Bringing the
                community together through music and culture.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-mystation-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-mystation-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Community Support</h3>
              <p className="text-white/60 text-sm">
                Local family assistance, sponsorships, and emergency support
                for community members in need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feed My Friends */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <HeartHandshake size={16} className="text-green-400" />
            <span className="text-green-400 text-sm font-bold uppercase tracking-wider">Community Outreach</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Feed My <span className="text-green-400">Friends</span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            We show up for our community. Free food, free clothes, free blankets, free tents. Nobody should go without the basics.
          </p>
        </div>

        {/* Photo Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="group relative rounded-2xl overflow-hidden border border-white/10">
            <img
              src="/images/foundation/feed-signs.jpg"
              alt="Volunteers holding signs: Free Tents, Free Clothes, Free Blankets"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-bold text-sm">Free Clothes, Tents & Blankets</p>
              <p className="text-white/60 text-xs">Giving away essentials to those in need</p>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden border border-white/10">
            <img
              src="/images/foundation/feed-team.jpg"
              alt="Feed My Friends volunteer team"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-bold text-sm">The Team</p>
              <p className="text-white/60 text-xs">Volunteers making it happen every time</p>
            </div>
          </div>

          <div className="group relative rounded-2xl overflow-hidden border border-white/10">
            <img
              src="/images/foundation/feed-kitchen.jpg"
              alt="Volunteers preparing meals in the kitchen"
              className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white font-bold text-sm">Feeding the Community</p>
              <p className="text-white/60 text-xs">Hot meals prepared with love</p>
            </div>
          </div>

        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-5 text-center border border-white/10">
            <Utensils size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">Hot Meals</p>
            <p className="text-white/50 text-sm">Served every event</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center border border-white/10">
            <Heart size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">Free Clothes</p>
            <p className="text-white/50 text-sm">Coats, blankets & more</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center border border-white/10">
            <Users size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">Volunteers</p>
            <p className="text-white/50 text-sm">Community powered</p>
          </div>
          <div className="glass rounded-2xl p-5 text-center border border-white/10">
            <HeartHandshake size={24} className="text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-white">100%</p>
            <p className="text-white/50 text-sm">Donated to those in need</p>
          </div>
        </div>
      </section>

      {/* About Mike Page */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="aspect-square bg-mystation-accent rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-8xl mb-4 block">🎤</span>
                <h3 className="text-2xl font-bold text-white">Mike Page</h3>
                <p className="text-white/60">Artist & Founder</p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold text-white mb-6">About Mike Page</h2>
            <p className="text-white/70 text-lg mb-6">
              {artistInfo.bio}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-mystation-gold" />
                <span className="text-white/80">Originally from Elgin, IL • Based in Atlanta, GA</span>
              </div>
              <div className="flex items-center gap-3">
                <Music size={20} className="text-mystation-gold" />
                <span className="text-white/80">Founder of Impossible Dreamz Music Group (IDMG)</span>
              </div>
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-mystation-gold" />
                <span className="text-white/80">Co-founder of Love on the Lawn Festival</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://instagram.com/mikepagelivin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white/80"
              >
                Instagram <ExternalLink size={14} />
              </a>
              <a
                href={artistInfo.socials.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition text-white/80"
              >
                Spotify <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="max-w-screen-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Make a Difference?
        </h2>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
          Stream for free. Donate what you can. Every contribution helps us
          build a stronger community through music.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://cash.app/$RIDE4PAGEMUSIC847"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-full hover:shadow-lg hover:shadow-green-500/30 transition flex items-center gap-2"
          >
            <Heart size={20} />
            Donate via CashApp
          </a>
          <a
            href="/merch"
            className="px-8 py-4 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition flex items-center gap-2"
          >
            <Music size={20} />
            Shop Merch
          </a>
        </div>
      </section>
    </div>
  );
}
