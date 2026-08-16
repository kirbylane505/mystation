/**
 * MYSTATION - Subscribe Modal (Pay What You Want)
 * PWYW pivot: name your price ($1–$999/mo). Suggested $4.99. Cancel anytime.
 * Preset chips ($3/$5/$10/$25/Custom) + editable amount → /api/subscription/checkout
 */

"use client";

import { useState } from "react";
import { usePlayerStore, useUserStore } from "@/store/playerStore";
import { X, Music, Check, CreditCard, Crown, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { isNative } from "@/lib/native";

// PWYW configuration
const PRESET_AMOUNTS = [300, 500, 1000, 2500]; // $3, $5, $10, $25 in cents
const SUGGESTED_AMOUNT = 499; // $4.99 default
const MIN_CENTS = 100; // $1 floor
const MAX_CENTS = 99900; // $999 ceiling

export default function SubscribeModal() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  // PWYW state
  const [selectedPreset, setSelectedPreset] = useState(SUGGESTED_AMOUNT);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState(SUGGESTED_AMOUNT);

  const finalAmountCents = customMode ? customAmount : selectedPreset;
  const amountDisplay = (finalAmountCents / 100).toFixed(2);
  const isValidAmount =
    finalAmountCents >= MIN_CENTS && finalAmountCents <= MAX_CENTS;

  const { showSubscribeModal, closeSubscribeModal, pendingTrack, setTrack } =
    usePlayerStore();
  const { subscribe, isSubscribed } = useUserStore();

  // NEVER show subscribe modal to subscribers — they're already in
  if (!showSubscribeModal) return null;
  if (isSubscribed) {
    // Subscriber somehow triggered the modal — auto-close and play the track
    if (pendingTrack) {
      setTimeout(() => {
        setTrack(pendingTrack);
        closeSubscribeModal();
      }, 0);
    } else {
      setTimeout(() => closeSubscribeModal(), 0);
    }
    return null;
  }
  // Also check cookie directly (belt-and-suspenders — cookie is source of truth)
  if (
    typeof document !== "undefined" &&
    (document.cookie.includes("mystation-sub-flag=") ||
      document.cookie.includes("mystation-sub=") ||
      document.cookie.includes("mystation-friend="))
  ) {
    if (pendingTrack) {
      setTimeout(() => {
        setTrack(pendingTrack);
        closeSubscribeModal();
      }, 0);
    } else {
      setTimeout(() => closeSubscribeModal(), 0);
    }
    return null;
  }

  async function handleContinue() {
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (!isValidAmount) {
      setError("Amount must be between $1 and $999.");
      return;
    }
    setLoading(true);
    try {
      if (pendingTrack) {
        localStorage.setItem(
          "mystation-pending-track",
          JSON.stringify(pendingTrack),
        );
      }
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const handleAccessCode = async () => {
    if (!accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError("");

    try {
      const res = await fetch("/api/access-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        subscribe("friend@mystation.com");
        setSuccess(true);
        setTimeout(() => {
          closeSubscribeModal();
          if (pendingTrack) {
            setTrack(pendingTrack);
          }
          setSuccess(false);
        }, 1500);
      } else {
        setCodeError("Invalid code. Try again.");
      }
    } catch {
      setCodeError("Something went wrong. Try again.");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — let them browse, but nothing works without subscribing */}
        <button
          onClick={closeSubscribeModal}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="pt-8 pb-4 px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              {success ? (
                <Check size={36} className="text-white animate-bounce" />
              ) : (
                <Crown size={36} className="text-white" />
              )}
            </div>

            {success ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Welcome to the Family!
                </h2>
                <p className="text-white/60 text-sm">
                  Unlimited streaming unlocked
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-1">
                  Subscribe to Unlock Full Tracks
                </h2>
                <div className="space-y-1 mt-2">
                  <p className="text-white/70 text-sm flex items-center justify-center gap-1.5">
                    <Check size={14} className="text-green-400 shrink-0" />{" "}
                    Preview any song. Subscribe for full streaming.
                  </p>
                  <p className="text-[#D4AF37] text-sm font-semibold flex items-center justify-center gap-1.5">
                    <span className="text-base">🎫</span> Stay through August =
                    FREE LOTL ticket ($20 value)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!success && (
          <>
            {/* PWYW Picker */}
            <div className="px-6 pb-4">
              {isNative ? (
                // iOS native app — Apple IAP rules forbid in-app web checkout.
                // Direct users to the website to pick their amount and subscribe.
                <div className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <p className="text-white/70 text-sm">
                    Pick your monthly amount on our website — pay what you want,
                    starting at $1/mo.
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">
                    Pay what you want, monthly:
                  </p>
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
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
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
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 font-bold">
                      $
                    </span>
                    <input
                      type="number"
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
                      className="w-full pl-10 pr-16 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                      / month
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Suggested $4.99/mo · Minimum $1/mo · Cancel anytime
                  </p>

                  {/* Email field */}
                  <div className="mt-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500"
                      autoComplete="email"
                    />
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs mt-2 text-center">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="px-6 pb-4">
              {isNative ? (
                <>
                  <a
                    href="https://mystationlive.com/subscribe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    Subscribe at mystationlive.com
                  </a>
                  <p className="text-white/30 text-xs text-center mt-2">
                    Subscribe on our website to unlock full streaming. All
                    proceeds support youth & community programs.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!email || !isValidAmount || loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Continue at ${amountDisplay}/mo
                      </>
                    )}
                  </button>
                  <p className="text-white/30 text-xs text-center mt-2">
                    Cancel anytime. All proceeds support youth & community
                    programs.
                  </p>
                </>
              )}
            </div>

            {/* Pending track preview */}
            {pendingTrack && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Music size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-[10px] mb-0.5">
                      Ready to play:
                    </p>
                    <p className="text-white font-medium text-sm truncate">
                      {pendingTrack.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Merch CTA */}
            <div className="px-6 pb-3">
              <Link
                href="/merch"
                onClick={() => closeSubscribeModal()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-300 font-semibold rounded-xl hover:bg-orange-500/30 transition text-sm"
              >
                <ShoppingBag size={15} />
                Shop Official Merch
              </Link>
            </div>

            {/* Access Code — hidden on iOS native (Apple IAP rules) */}
            {!isNative && (
              <div className="px-6 pb-3">
                {!showCodeInput ? (
                  <button
                    onClick={() => setShowCodeInput(true)}
                    className="w-full text-center text-blue-400/70 text-xs hover:text-blue-400 transition"
                  >
                    Have an access code?
                  </button>
                ) : (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                    <p className="text-white/60 text-xs mb-2 text-center">
                      Enter your access code for free unlimited streaming
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => {
                          setAccessCode(e.target.value);
                          setCodeError("");
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAccessCode()
                        }
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500 uppercase tracking-wider"
                        autoFocus
                      />
                      <button
                        onClick={handleAccessCode}
                        disabled={codeLoading || !accessCode.trim()}
                        className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition disabled:opacity-50 text-sm"
                      >
                        {codeLoading ? "..." : "Go"}
                      </button>
                    </div>
                    {codeError && (
                      <p className="text-red-400 text-xs mt-2 text-center">
                        {codeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="px-6 pb-6 flex flex-col items-center gap-2">
              <Link
                href="/account"
                onClick={() => closeSubscribeModal()}
                className="text-blue-400 text-sm font-medium hover:text-blue-300 transition py-1 px-4"
              >
                Already a member? Sign In
              </Link>
              <button
                onClick={closeSubscribeModal}
                className="text-white/40 text-xs hover:text-white/60 transition py-1 px-4"
              >
                Just browsing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
