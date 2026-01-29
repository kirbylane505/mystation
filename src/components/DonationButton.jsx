/**
 * MYSTATION - Premium Donation Button & Modal
 * Navy blue theme - All donations to Mike Page Foundation
 */

'use client';

import { useState } from 'react';
import { Heart, X, Check, Sparkles } from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

export default function DonationButton({ variant = 'default' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDonate = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount < 1) return;

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsDone(true);

    setTimeout(() => {
      setIsModalOpen(false);
      setIsDone(false);
      setSelectedAmount(null);
      setCustomAmount('');
    }, 2500);
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass rounded-3xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Support the Music</h3>
                  <p className="text-white/50 text-sm">
                    100% goes to Mike Page Foundation
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 pt-2">
              {isDone ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                    <Check size={36} className="text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">Thank You!</h4>
                  <p className="text-white/50">
                    Your donation helps support youth music programs and community events.
                  </p>
                </div>
              ) : (
                <>
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {PRESET_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`py-4 rounded-xl font-bold text-lg transition ${
                          selectedAmount === amount
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-6">
                    <label className="text-white/40 text-sm mb-2 block uppercase tracking-wider">
                      Custom Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 text-lg">$</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        className="w-full py-4 pl-10 pr-5 text-lg"
                      />
                    </div>
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
                        <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                          <Sparkles size={12} />
                          Your donation is tax-deductible
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    onClick={handleDonate}
                    disabled={!finalAmount || isProcessing}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition ${
                      finalAmount && !isProcessing
                        ? 'btn-primary'
                        : 'bg-white/5 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Donate ${finalAmount ? `$${finalAmount}` : ''}`
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
