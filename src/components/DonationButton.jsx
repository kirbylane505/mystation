/**
 * MYSTATION - Donation Button & Modal
 * All donations go to Mike Page Foundation (501c3)
 */

'use client';

import { useState } from 'react';
import { useDonationStore } from '@/store/playerStore';
import { Heart, X, Check, Gift } from 'lucide-react';

const PRESET_AMOUNTS = [1, 5, 10, 25, 50, 100];

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

    // TODO: Integrate Stripe here
    // For now, simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsDone(true);

    setTimeout(() => {
      setIsModalOpen(false);
      setIsDone(false);
      setSelectedAmount(null);
      setCustomAmount('');
    }, 2000);
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <>
      {/* Trigger Button */}
      {variant === 'hero' ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-gold donation-highlight flex items-center gap-2"
        >
          <Gift size={20} />
          Support the Foundation
        </button>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-mystation-gold/20 text-mystation-gold rounded-full hover:bg-mystation-gold/30 transition"
        >
          <Heart size={18} />
          Donate
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-mystation-gold/20 to-transparent p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Support the Music</h3>
                  <p className="text-white/60 text-sm mt-1">
                    100% goes to Mike Page Foundation
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {isDone ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Thank You!</h4>
                  <p className="text-white/60">
                    Your donation helps support youth music programs and community events.
                  </p>
                </div>
              ) : (
                <>
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {PRESET_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount('');
                        }}
                        className={`py-3 rounded-lg font-semibold transition ${
                          selectedAmount === amount
                            ? 'bg-mystation-gold text-mystation-dark'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-6">
                    <label className="text-white/60 text-sm mb-2 block">
                      Or enter custom amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">$</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="0.00"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedAmount(null);
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-8 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mystation-gold"
                      />
                    </div>
                  </div>

                  {/* Foundation Info */}
                  <div className="bg-mystation-accent/50 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="foundation-badge">501(c)(3)</div>
                      <div>
                        <p className="text-sm text-white/80">
                          Mike Page Foundation uses donations for youth music programs,
                          scholarships, and Love on the Lawn events.
                        </p>
                        <p className="text-xs text-mystation-gold mt-2">
                          Your donation is tax-deductible
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    onClick={handleDonate}
                    disabled={!finalAmount || isProcessing}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                      finalAmount && !isProcessing
                        ? 'btn-gold'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-mystation-dark rounded-full animate-spin" />
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
