'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [creator, setCreator] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [copied, setCopied] = useState(false);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  useEffect(() => {
    const email = getEmail();
    if (!email) return;

    fetch(`/api/creators/analytics?email=${encodeURIComponent(email)}&summary=true`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    fetch(`/api/creators/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.creator) {
          setCreator(d.creator);
          if (!d.creator.onboarding_dismissed) {
            setShowOnboarding(true);
          }
        }
      })
      .catch(console.error);
  }, []);

  const dismissOnboarding = async () => {
    setShowOnboarding(false);
    const email = getEmail();
    if (!email) return;
    await fetch('/api/creators/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, onboarding_dismissed: true }),
    });
  };

  const copyProfileLink = () => {
    if (!creator?.slug) return;
    navigator.clipboard.writeText(`https://mystationlive.com/artist/${creator.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Category-specific onboarding steps
  const getSteps = (c) => {
    if (!c) return [];

    // Universal steps everyone gets
    const universal = [
      { label: 'Upload your profile photo', done: !!c.avatar_url, action: '/dashboard/settings', actionLabel: 'Go to Settings' },
      { label: 'Upload your banner image', done: !!c.banner_url, action: '/dashboard/settings', actionLabel: 'Go to Settings' },
      { label: 'Write your bio', done: !!(c.bio && c.bio.length > 0), action: '/dashboard/settings', actionLabel: 'Go to Settings' },
    ];

    // Category-specific steps
    const categorySteps = {
      musician: [
        { label: 'Upload your first track', done: (c.track_count || 0) > 0, action: '/dashboard/upload', actionLabel: 'Upload Track' },
        { label: 'Create your first merch item', done: false, action: '/dashboard/merch', actionLabel: 'Create Merch' },
      ],
      producer: [
        { label: 'Upload your first beat', done: (c.track_count || 0) > 0, action: '/dashboard/upload', actionLabel: 'Upload Beat' },
        { label: 'Create your first merch item', done: false, action: '/dashboard/merch', actionLabel: 'Create Merch' },
      ],
      dj: [
        { label: 'Upload a mix', done: (c.track_count || 0) > 0, action: '/dashboard/upload', actionLabel: 'Upload Mix' },
        { label: 'Go live with a set', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
      ],
      podcaster: [
        { label: 'Go live with your first episode', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
        { label: 'Save a replay to your videos', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      ],
      fitness_wellness: [
        { label: 'Go live with your first stream', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
        { label: 'Save a workout video', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      ],
      barber_stylist: [
        { label: 'Upload a video of your work', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
        { label: 'Add your booking link to your bio', done: !!(c.bio && c.bio.length > 0), action: '/dashboard/settings', actionLabel: 'Edit Bio' },
      ],
      visual_artist: [
        { label: 'Upload a video of your process', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
        { label: 'Create merch from your art', done: false, action: '/dashboard/merch', actionLabel: 'Create Merch' },
      ],
      chef_food: [
        { label: 'Go live with a cooking session', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
        { label: 'Save a recipe video', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      ],
      educator_coach: [
        { label: 'Go live with your first session', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
        { label: 'Save a lesson to your videos', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      ],
      comedian: [
        { label: 'Go live with a set', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
        { label: 'Save a clip to your videos', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      ],
      model_fashion: [
        { label: 'Upload a video or lookbook', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
        { label: 'Create your first merch item', done: false, action: '/dashboard/merch', actionLabel: 'Create Merch' },
      ],
    };

    // Default for custom or unknown
    const defaultSteps = [
      { label: 'Upload a video', done: false, action: '/dashboard/videos', actionLabel: 'View Videos' },
      { label: 'Go live on PodStation', done: false, action: '/podstation/go-live', actionLabel: 'Go Live' },
    ];

    const specific = categorySteps[c.category] || defaultSteps;

    // Share step always last
    const share = { label: 'Share your page', done: false, action: null, actionLabel: copied ? 'Copied!' : 'Copy Link', onClick: copyProfileLink };

    return [...universal, ...specific, share];
  };

  const steps = getSteps(creator);

  const completedCount = steps.filter((s) => s.done).length;

  const isMusic = creator && ['musician', 'producer', 'dj'].includes(creator.category);

  const cards = isMusic ? [
    { label: 'Total Plays', value: stats?.totalPlays ?? 0, color: 'text-blue-400' },
    { label: 'Tracks', value: stats?.trackCount ?? 0, color: 'text-purple-400' },
    { label: 'Followers', value: stats?.followerCount ?? 0, color: 'text-green-400' },
    { label: 'Merch Items', value: stats?.merchCount ?? 0, color: 'text-[#D4AF37]' },
  ] : [
    { label: 'Views', value: stats?.totalPlays ?? 0, color: 'text-blue-400' },
    { label: 'Videos', value: stats?.trackCount ?? 0, color: 'text-purple-400' },
    { label: 'Followers', value: stats?.followerCount ?? 0, color: 'text-green-400' },
    { label: 'Merch Items', value: stats?.merchCount ?? 0, color: 'text-[#D4AF37]' },
  ];

  const actions = [
    { href: '/dashboard/upload', label: 'Upload Track', desc: 'Add music to your catalog', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { href: '/dashboard/merch', label: 'Create Merch', desc: 'Design and sell products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { href: '/dashboard/settings', label: 'Edit Profile', desc: 'Update bio, avatar, links', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { href: '/dashboard/analytics', label: 'View Analytics', desc: 'Plays, fans, revenue', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Onboarding Guide */}
      {showOnboarding && (
        <div className="bg-[#18181b] border-2 border-[#D4AF37]/40 rounded-xl p-6 mb-8 relative">
          <button
            onClick={dismissOnboarding}
            className="absolute top-4 right-4 text-[#71717a] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-lg font-bold text-[#D4AF37] mb-1">Set Up Your Station</h2>
          <p className="text-sm text-[#a1a1aa] mb-4">{completedCount} of {steps.length} complete</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-[#27272a] rounded-full mb-5">
            <div
              className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* Checkbox */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-[#52525b]'
                }`}>
                  {step.done && (
                    <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span className={`flex-1 text-sm ${step.done ? 'text-[#52525b] line-through' : 'text-white'}`}>
                  {step.label}
                </span>

                {/* Action button */}
                {!step.done && (
                  step.action ? (
                    <Link
                      href={step.action}
                      className="px-3 py-1.5 text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      {step.actionLabel}
                    </Link>
                  ) : (
                    <button
                      onClick={step.onClick}
                      className="px-3 py-1.5 text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 rounded-lg hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      {step.actionLabel}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <p className="text-sm text-[#71717a]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
              <svg className="w-6 h-6 text-[#D4AF37] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
              <div>
                <p className="text-white font-medium">{a.label}</p>
                <p className="text-xs text-[#71717a]">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
