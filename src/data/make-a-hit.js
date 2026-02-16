/**
 * MYSTATION - MAKE A HIT
 * Artists pay to feature with Mike Page
 * Open verse tracks available for collaboration
 * 50/50 split on release - both parties push it
 */

export const makeAHitTracks = [
  {
    id: 'hit-1',
    title: 'Sometime I',
    audioFile: '/audio/Impossible Dreamz 2024 113_Mike Page_1.wav',
    producer: 'The Cubist',
    bpm: 140,
    key: 'C minor',
    mood: 'Reflective / Hard',
    openVerse: 2, // Second verse is open
    verseOpen: true, // Set to false when verse is taken
    price: 500,
    description: 'Hard-hitting trap track with an open second verse. Perfect for artists who want to showcase their lyrical ability.',
  },
  {
    id: 'hit-2',
    title: 'Bounce Back',
    audioFile: '/audio/Impossible Dreamz 826_Mike Page_2.wav',
    producer: 'The Cubist',
    bpm: 145,
    key: 'G minor',
    mood: 'Motivational / Trap',
    openVerse: 2,
    verseOpen: true,
    price: 500,
    description: 'Comeback anthem with space for your verse. Great for artists with a story to tell.',
  },
  {
    id: 'hit-3',
    title: 'Walk In',
    audioFile: '/audio/idmg x st236 - Mike Page (ruff01) Walk In.wav',
    producer: 'The Cubist',
    bpm: 138,
    key: 'D minor',
    mood: 'Confident / Street',
    openVerse: 2,
    verseOpen: true,
    price: 750,
    description: 'Club-ready banger. Your verse could be the one that makes this go viral.',
  },
];

export const makeAHitInfo = {
  title: "LETS MAKE A HIT",
  subtitle: "Feature with Mike Page",
  description: "Choose a track, record your verse, and release it together. 50/50 split on all platforms.",

  howItWorks: [
    {
      step: 1,
      title: "Choose Your Track",
      description: "Listen to available tracks with open verses. Find the one that fits your style."
    },
    {
      step: 2,
      title: "Pay & Reserve",
      description: "Secure your spot on the track. Payment reserves the open verse for you."
    },
    {
      step: 3,
      title: "Record Your Verse",
      description: "You have 14 days to submit your verse. We'll send you the stems and instructions."
    },
    {
      step: 4,
      title: "Mix & Release",
      description: "The Cubist mixes your verse. Track releases on all platforms under both names."
    },
    {
      step: 5,
      title: "Split & Promote",
      description: "50/50 split on all royalties. Both artists push it to their audiences."
    }
  ],

  benefits: [
    "Official release on Spotify, Apple Music, and all platforms",
    "50/50 royalty split - you keep half of everything",
    "Professional mix by The Cubist (100M+ streams)",
    "Promotion from Mike Page's social media",
    "Your name on the official credits",
    "Potential for music video collaboration"
  ],

  requirements: [
    "Must be 18+ or have guardian permission",
    "Verse must be original - no samples without clearance",
    "Clean and explicit versions may be required",
    "14-day deadline to submit verse after payment",
    "Professional quality recording required (no phone recordings)"
  ],

  contact: {
    email: "mystationllc@gmail.com",
    subject: "MAKE A HIT - [Track Name]",
    instagram: "@mikepage"
  }
};
