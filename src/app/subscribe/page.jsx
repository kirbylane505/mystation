'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Crown, Gem, Star, Headphones, Check, CreditCard,
  Music, Scissors, Sparkles, Dumbbell, ShoppingBag, Palette,
  Globe, DollarSign, Users, BarChart3, Lock, Zap,
  Heart, Shield, ListMusic, Radio
} from 'lucide-react';

const STRIPE_LINKS = {
  regular: 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00',
  premium: 'https://buy.stripe.com/bJe00lcmL2t8cuUcv11oI01',
  diamond: 'https://buy.stripe.com/6oUbJ3euT5FkdyYgLh1oI02',
};

const USE_CASES = [
  {
    icon: Music,
    title: 'Musicians',
    color: 'blue',
    items: [
      'Upload your music — no distributor, no approval wait',
      'Sell beats, albums, singles',
      'Build your fanbase with zero algorithm interference',
      'Create playlists, curate your sound',
    ],
  },
  {
    icon: Sparkles,
    title: 'Hairstylists',
    color: 'pink',
    items: [
      'Showcase your portfolio — braids, locs, wigs, color, natural hair',
      'Sell hair products, bundles, tools',
      'Book clients right from your station',
      'Your brand, your page, your clientele',
    ],
  },
  {
    icon: Palette,
    title: 'Nail Techs',
    color: 'purple',
    items: [
      'Display your sets — acrylics, gel, press-ons, nail art',
      'Sell custom press-on sets and nail care products',
      'Build your client list without depending on IG',
      'Your work speaks, your station amplifies',
    ],
  },
  {
    icon: Scissors,
    title: 'Barbers',
    color: 'green',
    items: [
      'Post your cuts, fades, designs',
      'Sell grooming products and booking slots',
      'Build a client base that comes to YOU',
      'No algorithm deciding if your content gets seen',
    ],
  },
  {
    icon: Dumbbell,
    title: 'Fitness & Trainers',
    color: 'orange',
    items: [
      'Sell workout programs, meal plans, coaching packages',
      'Post routines, transformations, client results',
      'Build a community around YOUR method',
      'Keep 100% — no platform taking 30%',
    ],
  },
  {
    icon: ShoppingBag,
    title: 'Merch & Clothing',
    color: 'amber',
    items: [
      'Sell t-shirts, hoodies, hats, accessories',
      'No Etsy fees, no Shopify monthly, no middleman',
      'Full storefront on YOUR station',
      'Analytics — see what\'s selling and who\'s buying',
    ],
  },
];

const COLOR_MAP = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', dot: 'bg-pink-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
};

const DIAMOND_FEATURES = [
  { icon: Globe, text: 'Your own station — your name, your brand, your page' },
  { icon: Music, text: 'Upload content directly to the platform' },
  { icon: ShoppingBag, text: 'Sell digital, physical, or service-based products' },
  { icon: DollarSign, text: 'Keep 100% of your revenue' },
  { icon: BarChart3, text: 'Full analytics dashboard' },
  { icon: Users, text: 'Own your audience — no algorithm, no gatekeepers' },
  { icon: ShoppingBag, text: '10% off all MyStation merch' },
  { icon: Lock, text: 'Full Vault access — unreleased music' },
  { icon: Crown, text: 'Grammy Nights access — the private collection' },
  { icon: Gem, text: 'Diamond badge — verified everywhere' },
  { icon: Radio, text: 'Unlimited streaming of the entire catalog' },
  { icon: Zap, text: 'Global Spotify Search (100M+ songs)' },
  { icon: ListMusic, text: 'DJ Turntables, Fan Zone, Kickback Lounge' },
  { icon: Headphones, text: 'Background playback & CarPlay support' },
];

export default function SubscribePage() {
  const [selectedTier, setSelectedTier] = useState('diamond');

  const tiers = [
    {
      id: 'regular',
      name: 'Supporter',
      price: '4.99',
      icon: <Headphones size={24} className="text-blue-400" />,
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      btnClass: 'from-blue-500 to-blue-600',
      features: [
        'Unlimited streaming',
        'Background playback',
        'Support the Foundation',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '9.99',
      icon: <Star size={24} className="text-purple-400" />,
      gradient: 'from-purple-500/20 to-indigo-600/10',
      border: 'border-purple-500/40',
      btnClass: 'from-purple-500 to-indigo-600',
      popular: true,
      features: [
        'Everything in Supporter',
        'Global Spotify Search (100M+ songs)',
        'Early access to new drops',
        'Full Fan Zone access',
        'DJ Turntables unlocked',
      ],
    },
    {
      id: 'diamond',
      name: 'Diamond',
      price: '14.99',
      icon: <Gem size={24} className="text-amber-400" />,
      gradient: 'from-amber-500/20 to-yellow-600/10',
      border: 'border-amber-500/40',
      btnClass: 'from-amber-500 to-yellow-500',
      features: [
        'Everything in Premium',
        'YOUR OWN STATION',
        'Upload & sell anything',
        'Keep 100% of revenue',
        '10% off all merch',
        'Full Vault + Grammy Nights',
        'Diamond badge everywhere',
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-8 pb-32">
      <div className="max-w-screen-xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
            Your Station. Your Rules.<br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Your Bag.</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-2">
            MyStation isn't just for music. It's for ANYBODY with a hustle, a talent, or a dream.
          </p>
          <p className="text-white/40 text-sm">First month FREE for everyone. Cancel anytime.</p>
        </div>

        {/* Use Cases Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Whatever You Do — Own It</h2>
          <p className="text-white/50 text-center mb-8">Your station supports ANY hustle</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc) => {
              const c = COLOR_MAP[uc.color];
              const Icon = uc.icon;
              return (
                <div key={uc.title} className={`${c.bg} border ${c.border} rounded-2xl p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={22} className={c.text} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{uc.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {uc.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 ${c.dot} rounded-full mt-1.5 shrink-0`} />
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
            <p className="text-white/80 text-lg font-semibold mb-2">Cooking? Photography? Art? Tutoring? Consulting? Coaching? Skincare?</p>
            <p className="text-white/50">If you do ANYTHING — MyStation gives you the platform to OWN IT.</p>
          </div>
        </div>

        {/* Diamond Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Everything Diamond Members Get</h2>
          <p className="text-white/50 text-center mb-8">The full package. No compromises.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
            {DIAMOND_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <Icon size={18} className="text-amber-400 shrink-0" />
                  <span className="text-white/80 text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mb-16" id="plans">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Pick Your Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {tiers.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`relative text-left rounded-2xl p-6 border-2 transition-all duration-200 ${
                    isSelected
                      ? `bg-gradient-to-b ${tier.gradient} ${tier.border} scale-[1.02]`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  {tier.id === 'diamond' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Best Value
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    {tier.icon}
                    <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-white/70'}`}>{tier.name}</span>
                  </div>

                  <div className="mb-4">
                    <span className={`text-4xl font-black ${isSelected ? 'text-white' : 'text-white/60'}`}>${tier.price}</span>
                    <span className="text-white/40 text-sm">/mo</span>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'text-green-400' : 'text-white/30'}`} />
                        <span className={isSelected ? 'text-white/90' : 'text-white/50'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={STRIPE_LINKS[tier.id]}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full py-3 bg-gradient-to-r ${tier.btnClass} text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 text-sm shadow-lg`}
                  >
                    <CreditCard size={16} />
                    Subscribe — ${tier.price}/mo
                  </a>
                </button>
              );
            })}
          </div>

          {/* Subscribe Button */}
          <div className="max-w-md mx-auto mt-8">
            <a
              href={STRIPE_LINKS[selectedTier]}
              className={`w-full py-4 bg-gradient-to-r ${tiers.find(t => t.id === selectedTier)?.btnClass} text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg text-lg`}
            >
              <CreditCard size={20} />
              Subscribe — ${tiers.find(t => t.id === selectedTier)?.price}/mo
            </a>
            <p className="text-white/30 text-xs text-center mt-3">First month FREE for everyone. Cancel anytime. All proceeds support youth & community programs.</p>
          </div>
        </div>

        {/* Personal Message */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="glass rounded-2xl p-8 border border-white/10">
            <Heart size={32} className="text-red-500 mx-auto mb-4" />
            <p className="text-white/80 text-lg leading-relaxed mb-4">
              I built MyStation because I was tired of renting space on somebody else's platform. Tired of algorithms deciding who sees my work. Tired of asking for permission.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-4">
              So I built my own. And now I'm giving YOU the keys.
            </p>
            <p className="text-white font-bold text-xl">
              You subscribing means the world to me. Independent PAGE — I'm nothing without you.
            </p>
            <p className="text-white/40 text-sm mt-4">— Mike Page</p>
          </div>
        </div>

        {/* Foundation CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 rounded-full border border-white/10">
            <Shield size={16} className="text-green-400" />
            <span className="text-white/60 text-sm">All proceeds support the <strong className="text-white">Mike Page Foundation</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
