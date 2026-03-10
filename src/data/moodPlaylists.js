/**
 * MYSTATION - Mood Playlists
 * Curated by genre, BPM, energy & vibe — Apple Music / Spotify style
 * No duplicates across playlists. Each song in its BEST fit only.
 */

export const moodPlaylists = [
  {
    id: 'late-night',
    title: 'Late Night Vibes',
    description: 'Smooth & slow — wind down',
    icon: '\u{1F319}',
    gradient: 'from-indigo-900 to-purple-800',
    trackIds: [
      1,    // Live Like A King (76 BPM — slowest track, perfect opener)
      14,   // Damaged (86 BPM — emotional, slow)
      13,   // Stretch U Out (99 BPM — sensual, late night)
      2,    // Very Special (99 BPM — romantic feel)
      17,   // Suppa Luv Ya Momma (99 BPM — emotional)
      141,  // One Of A Kind (R&B)
      503,  // Be Alright ft. Nyvira (R&B)
      145,  // Naturally (R&B)
      142,  // Summer's Ours ft. Marilyn B (R&B)
      144,  // Please Don't Freestyle (R&B — slow freestyle)
    ]
  },
  {
    id: 'turn-up',
    title: 'Turn Up',
    description: 'High energy bangers',
    icon: '\u{1F525}',
    gradient: 'from-red-700 to-orange-600',
    trackIds: [
      100,  // Favorite Person (150 BPM — banger)
      138,  // Never Let The Money (160 BPM — hardest tempo)
      505,  // No Weapon (hitScore 95 — aggressive)
      103,  // Crash Out (135 BPM — Trap)
      153,  // Wet (Trap)
      154,  // Whole Bunch Of Money (Trap)
      155,  // Lights Come On (Trap)
      160,  // Eat Eat Eat (Trap)
      163,  // Trap Get Ugly (Trap)
      506,  // I Been On Some Shit (aggressive)
    ]
  },
  {
    id: 'chill-focus',
    title: 'Chill & Focus',
    description: 'Mid-tempo, locked in',
    icon: '\u{1F3A7}',
    gradient: 'from-teal-700 to-cyan-600',
    trackIds: [
      7,    // Rich Off Rags (112 BPM — smooth grind)
      8,    // Stand Up (112 BPM — motivational)
      9,    // VIBE ft. Vincent Berry (117 BPM — perfect focus)
      178,  // Mindset (title says it all — locked in)
      187,  // Take A While, Take A Minute (reflective focus)
      20,   // Up There (115 BPM — mid-tempo cruise)
      146,  // Now I'm Shinnin (Alternative Rap — grinding)
      147,  // I'm Not Just A Man (Alternative Rap — confident)
      104,  // 4 A Min (130 BPM — mid-tempo)
      510,  // Thats Facts (confident, locked in)
    ]
  },
  {
    id: 'throwback',
    title: 'Throwback',
    description: 'Classic Mike Page cuts',
    icon: '\u{1F4FC}',
    gradient: 'from-amber-800 to-yellow-700',
    trackIds: [
      301,  // Hope Ya Livin Good (Shezzy Knew It, 2014)
      305,  // I Know ft. King Deazel (Shezzy Knew It, 2014)
      310,  // Mo' Money (Shezzy Knew It, 2014)
      307,  // Warrior ft. Yung Majik (Shezzy Knew It, 2014)
      180,  // Piece of Mind (2020)
      181,  // Power To The People ft. Chairman Fred Hampton Jr (2021)
      3,    // DOING ME ft. King Deazel (Cindy's Son, 2022)
      179,  // Life Goes On (2022)
      173,  // To The Money (2023)
      174,  // Hammydowns (2023)
    ]
  },
  {
    id: 'workout',
    title: 'Workout Mode',
    description: 'Push through, go harder',
    icon: '\u{1F4AA}',
    gradient: 'from-green-700 to-emerald-600',
    trackIds: [
      500,  // I Want This One ft. Vincent Berry (IDMG Mixtape opener)
      511,  // Never Let The Money ft. Vincent Berry (IDMG Mixtape)
      190,  // Do What WE Do ft. Vincent Berry II (hitScore 94)
      502,  // Having My Way ft. Varro (IDMG Mixtape)
      512,  // Crash Out (IDMG Mixtape)
      10,   // Ask Yourself (152 BPM — fast pace)
      23,   // Trap (152 BPM — raw energy)
      106,  // 10 Toes Down (130 BPM — motivational)
      164,  // Bounce Back (Trap — title = workout energy)
      152,  // Friends On Friends (Hip-Hop — high energy)
    ]
  }
];
