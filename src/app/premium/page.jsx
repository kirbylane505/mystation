"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// PWYW pivot: name your price ($1–$999/mo). /premium suggests $14.99 as the
// higher-tier supporter anchor (matches old Diamond tier for grandfathered
// psychology). Same mechanic as /subscribe (commit 107f5d6) — different anchor.
const PRESET_AMOUNTS = [500, 1000, 2500, 5000]; // $5, $10, $25, $50 in cents
const SUGGESTED_AMOUNT = 1499; // $14.99 default — higher-tier anchor
const MIN_CENTS = 100; // $1 floor
const MAX_CENTS = 99900; // $999 ceiling

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [sessionEmail, setSessionEmail] = useState(null);

  // PWYW state — same pattern as SubscribeModal + /subscribe
  const [selectedPreset, setSelectedPreset] = useState(SUGGESTED_AMOUNT);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState(SUGGESTED_AMOUNT);

  const finalAmountCents = customMode ? customAmount : selectedPreset;
  const amountDisplay = (finalAmountCents / 100).toFixed(2);
  const isValidAmount =
    finalAmountCents >= MIN_CENTS && finalAmountCents <= MAX_CENTS;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const { user } = await res.json();
        if (!cancelled && user?.email) {
          setSessionEmail(user.email);
          setEmail(user.email);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleContinue(e) {
    e?.preventDefault?.();
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (!isValidAmount) {
      setError("Amount must be between $1 and $999.");
      return;
    }
    setLoading(true);
    try {
      // Preserve email for the return trip (same as /subscribe)
      try {
        localStorage.setItem("mystation-email", email);
      } catch {}

      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount_cents: finalAmountCents }),
      });
      const data = await res.json();

      if (res.status === 409 && data.existing_subscription_id) {
        // Grandfather safety — already has an active sub
        window.location.href = "/account";
        return;
      }
      if (data.alreadySubscribed) {
        window.location.href = "/account";
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Failed to start checkout.");
      setLoading(false);
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-white">
      <Link href="/" className="text-white/60 hover:text-white text-sm">
        ← Back
      </Link>
      <h1 className="text-4xl md:text-5xl font-black mt-4 mb-3">
        MyStation Premium
      </h1>
      <p className="text-xl text-white/80 mb-8">
        Support at the highest tier. Everything you love + free & discounted
        tickets to IDMG events.
      </p>

      <ul className="space-y-3 mb-8 text-lg">
        <li className="flex gap-3">
          <span>🎟️</span>
          <span>
            Free or discounted tickets to LOTL, IDMG showcases, MPF events
          </span>
        </li>
        <li className="flex gap-3">
          <span>🏆</span>
          <span>Supporter badge on your profile</span>
        </li>
        <li className="flex gap-3">
          <span>💬</span>
          <span>VIP color + priority in Live Chat</span>
        </li>
        <li className="flex gap-3">
          <span>🚀</span>
          <span>Early access — new features 2 weeks before anyone else</span>
        </li>
      </ul>

      <form onSubmit={handleContinue} className="space-y-5">
        {!sessionEmail && (
          <div>
            <label className="block text-sm text-white/70 mb-2">
              Email for receipts
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@email.com"
              required
              autoComplete="email"
              className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white"
            />
          </div>
        )}

        {/* PWYW block — replaces the old 6-month commitment checkbox */}
        <div className="bg-neutral-900 rounded-xl p-5 border border-white/10">
          <div className="text-sm text-white/70 mb-3">
            Name your price · Suggested $14.99/mo · Minimum $1/mo
          </div>

          {/* Preset chips + Custom */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_AMOUNTS.map((cents) => (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setSelectedPreset(cents);
                  setCustomMode(false);
                }}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                  !customMode && selectedPreset === cents
                    ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                ${cents / 100}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                customMode
                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              Custom
            </button>
          </div>

          {/* Amount field */}
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60 font-black text-2xl">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="999"
              step="0.01"
              value={amountDisplay}
              onChange={(e) => {
                const cents = Math.round(
                  parseFloat(e.target.value || "0") * 100,
                );
                setCustomMode(true);
                setCustomAmount(cents);
              }}
              className="w-full pl-12 pr-24 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-2xl font-black focus:outline-none focus:border-yellow-400"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 text-sm">
              / month
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 text-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!email || !isValidAmount || loading}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Loading…" : `Continue at $${amountDisplay}/mo`}
        </button>

        <p className="text-xs text-white/40 text-center">
          Secure checkout by Stripe. Cancel anytime.
        </p>

        <p className="text-center text-white/40 text-sm">
          Already subscribing?{" "}
          <Link
            href="/account"
            className="text-yellow-400 hover:text-yellow-300 font-semibold"
          >
            You're a Founding Supporter
          </Link>
        </p>
      </form>
    </main>
  );
}
