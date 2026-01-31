/**
 * MYSTATION - Daily Spin Wheel
 * Gamification feature - spin once per day for rewards
 */

'use client';

import { useState, useEffect } from 'react';
import { useEngagementStore, SPIN_PRIZES } from '@/store/engagementStore';
import { Gift, Sparkles, X } from 'lucide-react';

export default function DailySpin() {
  const [showModal, setShowModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const { canSpin, spin, lastSpinDate } = useEngagementStore();

  const canSpinToday = canSpin();

  const handleSpin = () => {
    if (!canSpinToday || isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    // Calculate random rotation (5-8 full rotations + prize position)
    const spins = 5 + Math.random() * 3;
    const prizeIndex = Math.floor(Math.random() * SPIN_PRIZES.length);
    const sliceAngle = 360 / SPIN_PRIZES.length;
    const targetRotation = spins * 360 + prizeIndex * sliceAngle + sliceAngle / 2;

    setRotation(prev => prev + targetRotation);

    // Get prize after animation
    setTimeout(() => {
      const prize = spin();
      setResult(prize);
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition ${
          canSpinToday
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
            : 'bg-white/5 text-white/40'
        }`}
      >
        <Gift size={18} />
        <span className="font-medium">Daily Spin</span>
        {canSpinToday && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition"
              >
                <X size={20} className="text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Gift size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Daily Spin</h2>
                  <p className="text-white/60">Spin once per day for rewards!</p>
                </div>
              </div>
            </div>

            {/* Wheel */}
            <div className="p-8 flex flex-col items-center">
              {/* Spin Wheel */}
              <div className="relative w-64 h-64 mb-8">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
                </div>

                {/* Wheel */}
                <div
                  className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl transition-transform duration-[4s] ease-out overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    background: `conic-gradient(
                      from 0deg,
                      #8B5CF6 0deg 60deg,
                      #EC4899 60deg 120deg,
                      #F59E0B 120deg 180deg,
                      #10B981 180deg 240deg,
                      #3B82F6 240deg 300deg,
                      #EF4444 300deg 360deg
                    )`
                  }}
                >
                  {/* Prize Labels */}
                  {SPIN_PRIZES.map((prize, i) => {
                    const angle = (i * 360) / SPIN_PRIZES.length + 30;
                    return (
                      <div
                        key={prize.id}
                        className="absolute top-1/2 left-1/2 w-20 text-center"
                        style={{
                          transform: `rotate(${angle}deg) translateX(50px)`,
                          transformOrigin: 'left center'
                        }}
                      >
                        <span className="text-2xl drop-shadow-lg">{prize.icon}</span>
                      </div>
                    );
                  })}

                  {/* Center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Sparkles className="text-purple-500" size={24} />
                  </div>
                </div>
              </div>

              {/* Result */}
              {result && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 text-center animate-scale-in">
                  <p className="text-4xl mb-2">{result.icon}</p>
                  <p className="text-xl font-bold text-white">{result.label}</p>
                  <p className="text-green-400 text-sm">You won! Check your rewards.</p>
                </div>
              )}

              {/* Spin Button */}
              <button
                onClick={handleSpin}
                disabled={!canSpinToday || isSpinning}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  canSpinToday && !isSpinning
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {isSpinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🎰</span> Spinning...
                  </span>
                ) : canSpinToday ? (
                  'SPIN NOW!'
                ) : (
                  'Come back tomorrow!'
                )}
              </button>

              {!canSpinToday && (
                <p className="text-white/40 text-sm mt-4">
                  You already spun today. Next spin available tomorrow!
                </p>
              )}
            </div>

            {/* Prize List */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <p className="text-white/40 text-xs text-center mb-3">Possible Prizes</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SPIN_PRIZES.map(prize => (
                  <span
                    key={prize.id}
                    className="px-2 py-1 bg-white/5 rounded text-xs text-white/60"
                  >
                    {prize.icon} {prize.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
