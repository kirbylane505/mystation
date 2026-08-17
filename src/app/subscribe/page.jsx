"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Gem,
  Headphones,
  CreditCard,
  Music,
  Scissors,
  Sparkles,
  Dumbbell,
  ShoppingBag,
  Palette,
  Globe,
  DollarSign,
  Users,
  BarChart3,
  Lock,
  Zap,
  Heart,
  Shield,
  ListMusic,
  Radio,
} from "lucide-react";

// PWYW pivot: name your price ($1–$999/mo). Suggested $4.99 = old Regular tier
// (grandfathered psychology). Mirrors SubscribeModal pattern (commits 7ea3941 + 8c51b07).
const PRESET_AMOUNTS = [300, 500, 1000, 2500]; // $3, $5, $10, $25 in cents
const SUGGESTED_AMOUNT = 499; // $4.99 default — matches old Regular tier
const MIN_CENTS = 100; // $1 floor
const MAX_CENTS = 99900; // $999 ceiling

const USE_CASES = [
  {
    icon: Music,
    title: "Musicians",
    color: "blue",
    items: [
      "Upload your music. No distributor, no approval wait.",
      "Sell beats, albums, singles",
      "Build your fanbase with zero algorithm interference",
      "Create playlists, curate your sound",
    ],
  },
  {
    icon: Sparkles,
    title: "Hairstylists",
    color: "pink",
    items: [
      "Showcase your portfolio: braids, locs, wigs, color, natural hair",
      "Sell hair products, bundles, tools",
      "Book clients right from your station",
      "Your brand, your page, your clientele",
    ],
  },
  {
    icon: Palette,
    title: "Nail Techs",
    color: "purple",
    items: [
      "Display your sets: acrylics, gel, press-ons, nail art",
      "Sell custom press-on sets and nail care products",
      "Build your client list without depending on IG",
      "Your work speaks, your station amplifies",
    ],
  },
  {
    icon: Scissors,
    title: "Barbers",
    color: "green",
    items: [
      "Post your cuts, fades, designs",
      "Sell grooming products and booking slots",
      "Build a client base that comes to YOU",
      "No algorithm deciding if your content gets seen",
    ],
  },
  {
    icon: Dumbbell,
    title: "Fitness & Trainers",
    color: "orange",
    items: [
      "Sell workout programs, meal plans, coaching packages",
      "Post routines, transformations, client results",
      "Build a community around YOUR method",
      "Keep 100%. No platform taking 30%.",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Merch & Clothing",
    color: "amber",
    items: [
      "Sell t-shirts, hoodies, hats, accessories",
      "No Etsy fees, no Shopify monthly, no middleman",
      "Full storefront on YOUR station",
      "Analytics: see what's selling and who's buying",
    ],
  },
];

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    dot: "bg-pink-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    dot: "bg-purple-400",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
};

const DIAMOND_FEATURES = [
  { icon: Globe, text: "Your own station. Your name, your brand, your page." },
  { icon: Music, text: "Upload content directly to the platform" },
  {
    icon: ShoppingBag,
    text: "Sell digital, physical, or service-based products",
  },
  { icon: DollarSign, text: "Keep 100% of your revenue" },
  { icon: BarChart3, text: "Full analytics dashboard" },
  { icon: Users, text: "Own your audience. No algorithm, no gatekeepers." },
  { icon: ShoppingBag, text: "10% off all MyStation merch" },
  { icon: Lock, text: "Full Vault access, unreleased music" },
  { icon: Crown, text: "Grammy Nights access, the private collection" },
  { icon: Gem, text: "Diamond badge, verified everywhere" },
  { icon: Radio, text: "Unlimited streaming of the entire catalog" },
  { icon: Zap, text: "Global Spotify Search (100M+ songs)" },
  { icon: ListMusic, text: "DJ Turntables, Fan Zone, Kickback Lounge" },
  { icon: Headphones, text: "Background playback & CarPlay support" },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // PWYW state — same pattern as SubscribeModal
  const [selectedPreset, setSelectedPreset] = useState(SUGGESTED_AMOUNT);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState(SUGGESTED_AMOUNT);

  const finalAmountCents = customMode ? customAmount : selectedPreset;
  const amountDisplay = (finalAmountCents / 100).toFixed(2);
  const isValidAmount =
    finalAmountCents >= MIN_CENTS && finalAmountCents <= MAX_CENTS;

  async function handleContinue() {
    setError("");
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
      // Preserve email for the return trip (existing behavior)
      localStorage.setItem("mystation-email", email);

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
      } else {
        setError(data.error || "Failed to create checkout session");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen pt-8 pb-32">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Your Station. Your Rules.
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Your Bag.
            </span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-2">
            MyStation isn't just for music. It's for ANYBODY with a hustle, a
            talent, or a dream.
          </p>
          <p className="text-white/40 text-sm">
            Pay what you want. Cancel anytime.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Whatever You Do, Own It
          </h2>
          <p className="text-white/50 text-center mb-8">
            Your station supports ANY hustle
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => {
              const c = COLOR_MAP[uc.color];
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className={`${c.bg} border ${c.border} rounded-2xl p-6`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon size={22} className={c.text} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{uc.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {uc.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div
                          className={`w-1.5 h-1.5 ${c.dot} rounded-full mt-1.5 shrink-0`}
                        />
                        <span className="text-white/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Anything Else */}
          <div className="mt-4 glass rounded-2xl p-6 text-center border border-white/10">
            <p className="text-white/80 text-lg font-semibold mb-2">
              Cooking? Photography? Art? Tutoring? Consulting? Coaching?
              Skincare?
            </p>
            <p className="text-white/50">
              If you do ANYTHING, MyStation gives you the platform to OWN IT.
            </p>
          </div>
        </div>

        {/* Everything You Get */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Everything You Get
          </h2>
          <p className="text-white/50 text-center mb-8">
            The full package. No compromises.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {DIAMOND_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl"
                >
                  <Icon size={18} className="text-amber-400 shrink-0" />
                  <span className="text-white/80 text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PWYW Form — replaces the old tier ladder */}
        <div className="mb-16" id="plans">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Name Your Price
          </h2>
          <p className="text-white/50 text-center mb-8">
            Pay what you want, monthly. Suggested $4.99/mo · Minimum $1/mo.
          </p>

          <div className="max-w-md mx-auto">
            <div className="glass rounded-2xl p-6 border border-white/10">
              {/* Preset chips + Custom */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
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

              {/* Amount field — page has more room so we go bigger */}
              <div className="relative mb-3">
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
                  className="w-full pl-12 pr-24 py-5 bg-white/10 border border-white/20 rounded-xl text-white text-3xl font-black focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 text-sm">
                  / month
                </span>
              </div>

              <p className="text-xs text-white/40 text-center mb-4">
                Suggested $4.99/mo · Cancel anytime
              </p>

              {/* Email */}
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="you@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500 mb-3"
                autoComplete="email"
              />

              {error && (
                <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
              )}

              <button
                type="button"
                onClick={handleContinue}
                disabled={!email || !isValidAmount || loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Continue at ${amountDisplay}/mo
                  </>
                )}
              </button>

              <p className="text-white/30 text-xs text-center mt-3">
                Cancel anytime. All proceeds support youth & community programs.
              </p>
            </div>

            {/* Grandfather note */}
            <p className="text-center text-white/40 text-sm mt-6">
              Already subscribing?{" "}
              <Link
                href="/account"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                You're a Founding Supporter
              </Link>
            </p>
          </div>
        </div>

        {/* Personal Message */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="glass rounded-2xl p-8 border border-white/10">
            <Heart size={32} className="text-red-500 mx-auto mb-4" />
            <p className="text-white/80 text-lg leading-relaxed mb-4">
              I built MyStation because I was tired of renting space on somebody
              else's platform. Tired of algorithms deciding who sees my work.
              Tired of asking for permission.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-4">
              So I built my own. And now I'm giving YOU the keys.
            </p>
            <p className="text-white font-bold text-xl">
              You subscribing means the world to me. Independent PAGE. I'm
              nothing without you.
            </p>
            <p className="text-white/40 text-sm mt-4">- Mike Page</p>
          </div>
        </div>

        {/* Foundation CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10">
            <Shield size={16} className="text-green-400" />
            <span className="text-white/60 text-sm">
              All proceeds support the{" "}
              <strong className="text-white">Mike Page Foundation</strong>{" "}
              501(c)(3) | EIN: 41-3820708
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
