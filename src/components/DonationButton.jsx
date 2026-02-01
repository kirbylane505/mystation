/**
 * MYSTATION - Cash App Donation Button
 * Direct payments to $RIDE4PAGEMUSIC847
 * Updated: 2026-01-31 7:27pm - Close button fix
 */

'use client';

import { useState } from 'react';
import { Heart, X, ExternalLink, DollarSign, Sparkles } from 'lucide-react';

const CASHTAG = '$RIDE4PAGEMUSIC847';
const CASHAPP_URL = 'https://cash.app/$RIDE4PAGEMUSIC847';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

export default function DonationButton({ variant = 'default' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(25);

  const handleDonate = () => {
    // Open Cash App with the selected amount
    const url = `${CASHAPP_URL}/${selectedAmount}`;
    window.open(url, '_blank');
  };

  const handleOpenCashApp = () => {
    window.open(CASHAPP_URL, '_blank');
  };

  return (
    <>
      {/* Trigger Button */}
      {variant === 'hero' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-secondary donation-highlight flex items-center gap-3"
        >
          <Heart size={18} />
          Support Foundation
        </button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-full hover:bg-blue-500/20 transition border border-blue-500/20"
        >
          <Heart size={16} />
          Donate
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-start pt-8 p-4 bg-black"
          onClick={() => setIsModalOpen(false)}
        >
          {/* EXIT BUTTON - BIG AND RED AT TOP */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="mb-6 flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-700 rounded-2xl transition shadow-2xl shadow-red-600/50 border-4 border-white"
          >
            <X size={32} className="text-white" strokeWidth={3} />
            <span className="text-white font-black text-2xl uppercase tracking-wider">EXIT / GO BACK</span>
          </button>

          <div className="relative w-full max-w-md max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="glass rounded-3xl overflow-hidden border border-white/10">
              {/* Header */}
              <div className="relative p-6 pb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent" />
                <div className="relative">
                  <h3 className="text-xl font-bold text-white mb-1">Support the Music</h3>
                  <p className="text-white/50 text-sm">
                    100% goes to Mike Page Foundation
                  </p>
                </div>
              </div>

            {/* Content */}
            <div className="p-6 pt-2">
              {/* Cash App Badge */}
              <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <DollarSign size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{CASHTAG}</p>
                  <p className="text-green-400 text-sm">Cash App</p>
                </div>
              </div>

              {/* Preset Amounts */}
              <p className="text-white/40 text-sm mb-3 uppercase tracking-wider">Select Amount</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {PRESET_AMOUNTS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`py-4 rounded-xl font-bold text-lg transition ${
                      selectedAmount === amount
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                        : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Foundation Info */}
              <div className="glass-light rounded-2xl p-5 mb-6">
                <div className="flex items-start gap-4">
                  <div className="foundation-badge text-xs px-3 py-2">501(c)(3)</div>
                  <div className="flex-1">
                    <p className="text-sm text-white/70 leading-relaxed">
                      Mike Page Foundation uses donations for youth music programs,
                      scholarships, and Love on the Lawn events.
                    </p>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <Sparkles size={12} />
                      Your donation supports the community
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                <p className="text-white/80 text-sm text-center">
                  When Cash App opens, add note: <span className="text-green-400 font-bold">"MYSTATION"</span>
                </p>
              </div>

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                className="w-full py-5 rounded-2xl font-bold text-lg transition bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 flex items-center justify-center gap-3"
              >
                <DollarSign size={24} />
                Send ${selectedAmount} via Cash App
                <ExternalLink size={18} />
              </button>

              {/* Or open Cash App directly */}
              <button
                onClick={handleOpenCashApp}
                className="w-full mt-3 py-3 rounded-xl text-white/60 hover:text-white transition text-sm"
              >
                Or open Cash App to enter custom amount →
              </button>

              {/* Close button at bottom */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full mt-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition flex items-center justify-center gap-2"
              >
                <X size={18} />
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
