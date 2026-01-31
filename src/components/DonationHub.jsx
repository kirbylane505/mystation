/**
 * MYSTATION - Donation Hub
 * Personal support + Foundation donations
 */

'use client';

import { useState } from 'react';
import { Heart, Building2, DollarSign, ExternalLink, Gift, Users } from 'lucide-react';

export default function DonationHub() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donationType, setDonationType] = useState('personal');

  const amounts = [5, 10, 25, 50, 100];

  const handleDonate = (type) => {
    const amount = selectedAmount || customAmount;

    if (type === 'personal') {
      // Direct to CashApp with amount
      window.open(`https://cash.app/$RIDE4PAGEMUSIC847/${amount || ''}`, '_blank');
    } else {
      // Foundation donation - could link to separate foundation CashApp or PayPal
      window.open(`https://cash.app/$RIDE4PAGEMUSIC847/${amount || ''}`, '_blank');
    }
  };

  return (
    <section className="max-w-screen-xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-3">Support the Music</h2>
        <p className="text-white/60">100% of donations go directly to the artist and foundation</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Personal Support Card */}
        <div className={`glass rounded-3xl p-6 border-2 transition-all cursor-pointer ${
          donationType === 'personal' ? 'border-green-500' : 'border-white/10 hover:border-white/30'
        }`} onClick={() => setDonationType('personal')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Support Mike Page</h3>
              <p className="text-white/50 text-sm">Direct artist support</p>
            </div>
          </div>

          <p className="text-white/60 text-sm mb-6">
            Your support helps fund new music, studio time, and creative projects.
            Goes directly to the artist.
          </p>

          {donationType === 'personal' && (
            <div className="space-y-4">
              {/* Amount Selection */}
              <div className="flex flex-wrap gap-2">
                {amounts.map(amt => (
                  <button
                    key={amt}
                    onClick={(e) => { e.stopPropagation(); setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      selectedAmount === amt
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* CashApp Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDonate('personal'); }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Gift size={20} />
                Send via CashApp
                <ExternalLink size={16} />
              </button>

              <p className="text-center text-white/40 text-xs">
                $RIDE4PAGEMUSIC847
              </p>
            </div>
          )}
        </div>

        {/* Foundation Card */}
        <div className={`glass rounded-3xl p-6 border-2 transition-all cursor-pointer ${
          donationType === 'foundation' ? 'border-blue-500' : 'border-white/10 hover:border-white/30'
        }`} onClick={() => setDonationType('foundation')}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Mike Page Foundation</h3>
              <p className="text-white/50 text-sm">501(c)(3) Tax Deductible</p>
            </div>
          </div>

          <p className="text-white/60 text-sm mb-6">
            Support youth music programs, scholarships, and community events.
            Your donation is tax-deductible.
          </p>

          {donationType === 'foundation' && (
            <div className="space-y-4">
              {/* Amount Selection */}
              <div className="flex flex-wrap gap-2">
                {amounts.map(amt => (
                  <button
                    key={amt}
                    onClick={(e) => { e.stopPropagation(); setSelectedAmount(amt); setCustomAmount(''); }}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      selectedAmount === amt
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Donate Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleDonate('foundation'); }}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold text-white hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Users size={20} />
                Donate to Foundation
                <ExternalLink size={16} />
              </button>

              <p className="text-center text-white/40 text-xs">
                Tax receipt provided for donations over $250
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streaming Links */}
      <div className="mt-12 text-center">
        <p className="text-white/40 text-sm mb-4">Streams also support the artist</p>
        <div className="flex justify-center gap-4">
          <a
            href="https://open.spotify.com/artist/3JwFt4Qb3uAUzipnMyM6G6"
            target="_blank"
            className="px-6 py-3 bg-[#1DB954] rounded-xl text-white font-medium hover:opacity-90 transition"
          >
            Stream on Spotify
          </a>
          <a
            href="https://music.apple.com/us/artist/mike-page/1515325834"
            target="_blank"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl text-white font-medium hover:opacity-90 transition"
          >
            Stream on Apple Music
          </a>
        </div>
      </div>
    </section>
  );
}
