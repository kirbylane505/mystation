/**
 * MYSTATION - About / Foundation Page
 * Full foundation info and donation focus
 */

'use client';

import { artistInfo } from '@/data/tracks';
import { Heart, Music, Award, Users, MapPin, Calendar, ExternalLink, Check } from 'lucide-react';

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
            501(c)(3) Nonprofit Organization
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Mike Page <span className="text-mystation-gold">Foundation</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Empowering youth through music, scholarships, and community events.
            100% of MyStation donations go directly to our programs.
          </p>

                  </div>
      </div>

      {/* Mission */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-white/70 text-lg mb-6">
              The Mike Page Foundation was created to give back to the community that shaped us.
              Based in Elgin, Illinois, we believe every young person deserves access to music,
              education, and opportunity.
            </p>
            <p className="text-white/70 text-lg">
              Through donations from MyStation streams and direct contributions, we fund youth
              music programs, provide scholarships, and host community events that bring people together.
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

      {/* Transparency */}
      <section className="bg-mystation-accent/30 py-16">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">100% Transparent</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-12">
            As a 501(c)(3) nonprofit, we maintain full transparency. Every dollar is accounted for
            and goes directly to our programs. No overhead, no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-6">
              <h4 className="text-4xl font-bold text-mystation-gold mb-2">100%</h4>
              <p className="text-white/60">Net donations to programs</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <h4 className="text-4xl font-bold text-mystation-gold mb-2">Tax-Free</h4>
              <p className="text-white/60">All donations are deductible</p>
            </div>
            <div className="glass rounded-2xl p-6">
              <h4 className="text-4xl font-bold text-mystation-gold mb-2">Annual</h4>
              <p className="text-white/60">Public reports published</p>
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
              </section>
    </div>
  );
}
