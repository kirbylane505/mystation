/**
 * MYSTATION - Artist Portal Landing
 * Sign up to build your own music world
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Music, DollarSign, Users, BarChart3, Upload, Globe,
  CheckCircle, ArrowRight, Sparkles, Heart, Shield, Zap
} from 'lucide-react';

export default function ArtistPortal() {
  const [email, setEmail] = useState('');
  const [artistName, setArtistName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSignup = (e) => {
    e.preventDefault();
    // Open CashApp with subscription amount
    const note = encodeURIComponent(`MyStation Artist Subscription - ${artistName} - ${email}`);
    window.open(`https://cash.app/$RIDE4PAGEMUSIC847/4.99?note=${note}`, '_blank');
    setSubmitted(true);
  };

  const features = [
    {
      icon: Globe,
      title: "Your Own Station",
      desc: "Get yourname.mystation.app - your personal music world"
    },
    {
      icon: Upload,
      title: "Unlimited Uploads",
      desc: "Upload your entire catalog - no limits, no compression"
    },
    {
      icon: DollarSign,
      title: "Keep 100%",
      desc: "All donations go directly to YOUR CashApp"
    },
    {
      icon: BarChart3,
      title: "Full Analytics",
      desc: "See who's listening, where, and when"
    },
    {
      icon: Users,
      title: "Own Your Fans",
      desc: "Build direct relationships, no algorithm gatekeeping"
    },
    {
      icon: Shield,
      title: "Your Rules",
      desc: "Set up nonprofit, charge fans, or keep it free"
    }
  ];

  const comparisons = [
    { feature: "Revenue per stream", spotify: "$0.003", mystation: "100% of tips" },
    { feature: "Upload limits", spotify: "Via distributor", mystation: "Unlimited" },
    { feature: "Fan data access", spotify: "Limited", mystation: "Full ownership" },
    { feature: "Custom branding", spotify: "No", mystation: "Yes" },
    { feature: "Direct donations", spotify: "No", mystation: "Yes (CashApp)" },
    { feature: "Monthly cost", spotify: "Free + distributor fees", mystation: "$4.99" },
  ];

  return (
    <div className="min-h-screen bg-mystation-darker">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-transparent to-blue-600/20" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30 mb-6">
            <Sparkles size={16} className="text-green-400" />
            <span className="text-green-300 text-sm font-medium">For Artists</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Build Your Own<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">Music World</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            God gave you the gift, not to pay a machine.
          </p>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
            Stop giving streaming platforms 70% of your money.
            Build your own station, keep 100% of what your fans give you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="#signup"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/30 transition flex items-center gap-2"
            >
              Start Your Station
              <ArrowRight size={20} />
            </a>
            <Link
              href="/"
              className="px-8 py-4 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/20 transition"
            >
              See Mike Page's Station
            </Link>
          </div>

          <p className="text-green-400 text-2xl font-bold">$4.99/month</p>
          <p className="text-white/40 text-sm">Cancel anytime via CashApp</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything You Need</h2>
        <p className="text-white/50 text-center mb-12">Your station, your rules, your money</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/10 hover:border-green-500/30 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 border border-green-500/20">
                <feature.icon size={28} className="text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Why MyStation?</h2>
        <p className="text-white/50 text-center mb-12">Compare and see the difference</p>

        <div className="glass rounded-2xl overflow-hidden border border-white/10">
          <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
            <div className="p-4 text-white/50 font-medium">Feature</div>
            <div className="p-4 text-center text-white/50 font-medium">Spotify</div>
            <div className="p-4 text-center text-green-400 font-bold">MyStation</div>
          </div>

          {comparisons.map((row, i) => (
            <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-0">
              <div className="p-4 text-white">{row.feature}</div>
              <div className="p-4 text-center text-white/40">{row.spotify}</div>
              <div className="p-4 text-center text-green-400 font-medium">{row.mystation}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">How It Works</h2>

        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, title: "Sign Up", desc: "Pay $4.99/mo via CashApp" },
            { step: 2, title: "Build", desc: "Upload music, customize your station" },
            { step: 3, title: "Share", desc: "Send your link to fans" },
            { step: 4, title: "Earn", desc: "Fans donate direct to YOUR CashApp" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                {item.step}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Signup Form */}
      <section id="signup" className="max-w-2xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-8 border border-green-500/20">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Payment Initiated!</h3>
              <p className="text-white/60 mb-6">
                Complete your $4.99 payment in CashApp, then we'll email you setup instructions within 24 hours.
              </p>
              <p className="text-white/40 text-sm">
                Questions? Email idmgatl@gmail.com
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <Zap size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Start Your Station</h3>
                <p className="text-white/60">$4.99/month • Cancel anytime</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Artist/Stage Name</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist name"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center gap-2"
                  >
                    <DollarSign size={20} />
                    Pay $4.99 via CashApp
                  </button>
                </div>

                <p className="text-center text-white/40 text-xs pt-2">
                  Payment goes to $RIDE4PAGEMUSIC847
                </p>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-white/50 text-sm text-center mb-4">What you get:</p>
                <div className="space-y-2">
                  {[
                    "Your own station URL (yourname.mystation.app)",
                    "Unlimited music uploads",
                    "Full analytics dashboard",
                    "Direct CashApp donations from fans",
                    "Email support"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                      <CheckCircle size={16} className="text-green-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Testimonial / Mike Page Story */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-8 border border-white/10 text-center">
          <Heart size={48} className="text-green-400 mx-auto mb-4" />
          <blockquote className="text-2xl text-white font-medium mb-6 leading-relaxed">
            "Here at MyStation is where you keep the money you work for. God gave you the gift, not to pay a machine or people you didn't come up with. Build your own music world for your fans like I did."
          </blockquote>
          <p className="text-green-400 font-bold">— Mike Page</p>
          <p className="text-white/40 text-sm">Founder, MyStation</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Own Your Music?</h2>
        <p className="text-white/50 mb-8">Join the movement. Build your station today.</p>
        <a
          href="#signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/30 transition"
        >
          Start for $4.99/month
          <ArrowRight size={20} />
        </a>
      </section>
    </div>
  );
}
