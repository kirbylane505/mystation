/**
 * MYSTATION - Listen Free Modal
 * Zero-friction phone OTP sign-in.
 * Phone -> Code -> Home (?welcome=1) -> Music autoplays.
 *
 * Task 4 of phone-OTP rollout. Migration mode is Task 6.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, Headphones } from 'lucide-react';

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
}

function formatPhoneDisplay(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function ListenFreeModal({ open, onClose }) {
  const router = useRouter();
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [phone, setPhone] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhone('');
      setPhoneDisplay('');
      setCode('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  // Allow ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function sendOtp(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    const normalized = normalizePhone(phoneDisplay || phone);
    if (!/^\+\d{11,15}$/.test(normalized)) {
      setLoading(false);
      setError('Enter a valid phone number.');
      return;
    }
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Could not send code. Try again.');
        return;
      }
      setPhone(normalized);
      setStep('code');
    } catch (err) {
      setLoading(false);
      setError('Network error. Try again.');
    }
  }

  async function verifyOtp(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      if (!res.ok) {
        setError(data.error || 'Invalid code. Try again.');
        return;
      }
      onClose();
      router.push('/?welcome=1');
      router.refresh();
    } catch (err) {
      setLoading(false);
      setError('Network error. Try again.');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Listen Free — phone sign in"
      className="fixed inset-0 z-[700] flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative w-full md:w-[440px] md:max-w-[95vw] md:rounded-2xl rounded-t-2xl border border-white/10 bg-gradient-to-b from-[#0d1117] to-[#0a1628] shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 text-white/50 hover:text-white transition z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Headphones size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {step === 'phone' ? 'Listen Free' : 'Enter Your Code'}
          </h2>
          <p className="text-white/50 text-sm">
            {step === 'phone'
              ? 'Your number is your account. No password.'
              : `Sent to ${phone}`}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-8">
          {step === 'phone' && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label htmlFor="lf-phone" className="block text-xs uppercase tracking-wider text-white/40 mb-2">
                  Phone number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="lf-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    placeholder="(555) 123-4567"
                    value={phoneDisplay}
                    onChange={(e) => setPhoneDisplay(formatPhoneDisplay(e.target.value))}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 transition text-base"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || phoneDisplay.replace(/\D/g, '').length < 10}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 text-base"
              >
                {loading ? 'Sending…' : 'Send Code'}
              </button>

              <p className="text-[11px] text-white/30 text-center leading-relaxed pt-2">
                By continuing you agree to get a one-time code by SMS.
                Msg & data rates may apply.
              </p>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label htmlFor="lf-code" className="block text-xs uppercase tracking-wider text-white/40 mb-2">
                  6-digit code
                </label>
                <input
                  id="lf-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/10 transition text-center text-2xl tracking-[0.4em] font-mono"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-blue-500/30 text-base"
              >
                {loading ? 'Verifying…' : 'Listen Free'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="w-full text-white/50 hover:text-white text-sm py-2 transition"
              >
                ← Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
