/**
 * MYSTATION - Mood Playlists
 * Curated playlists using real track IDs from tracks.js
 * Grouped by BPM, vibe, era, and energy level
 */

export const moodPlaylists = [
  {
    id: 'late-night',
    title: 'Late Night Vibes',
    description: 'Smooth & slow — wind down',
    icon: '\u{1F319}',
    gradient: 'from-indigo-900 to-purple-800',
    trackIds: [
      1,    // Live Like A King (76 BPM)
      4,    // IDMG 254 ft. Soldier (86 BPM)
      13,   // Damaged (86 BPM)
      2,    // Very Special (99 BPM)
      12,   // Stretch U Out (99 BPM)
      16,   // Suppa Luv Ya Momma (99 BPM)
      141,  // One Of A Kind (R&B)
      503,  // Be Alright (R&B)
      105,  // One Love (120 BPM)
      145,  // Naturally (R&B)
    ]
  },
  {
    id: 'turn-up',
    title: 'Turn Up',
    description: 'High energy bangers',
    icon: '\u{1F525}',
    gradient: 'from-red-700 to-orange-600',
    trackIds: [
      100,  // Favorite Person (150 BPM)
      138,  // Never Let The Money (160 BPM)
      101,  // Having My Way (140 BPM)
      103,  // Crash Out (135 BPM)
      10,   // Ask Yourself (152 BPM)
      21,   // Trap (152 BPM)
      19,   // I Remember That (144 BPM)
      14,   // Ready For Me (140 BPM)
      3,    // Doing Me (140 BPM)
      505,  // No Weapon (hitScore 95)
    ]
  },
  {
    id: 'chill-focus',
    title: 'Chill & Focus',
    description: 'Mid-tempo, locked in',
    icon: '\u{1F3A7}',
    gradient: 'from-teal-700 to-cyan-600',
    trackIds: [
      7,    // Rich Off Rags (112 BPM)
      8,    // Stand Up (112 BPM)
      12,   // Stretch U Out (99 BPM)
      9,    // VIBE ft. Vincent Berry (117 BPM)
      18,   // Pick It Up, Bag It (120 BPM)
      20,   // Til We All Up (120 BPM)
      6,    // Moved South (129 BPM)
      11,   // Things We Been Through (112 BPM)
      139,  // I Need Her
      184,  // Unconditionally
    ]
  },
  {
    id: 'throwback',
    title: 'Throwback',
    description: 'Classic Mike Page cuts',
    icon: '\u{1F4FC}',
    gradient: 'from-amber-800 to-yellow-700',
    trackIds: [
      1,    // Live Like A King (2022)
      2,    // Very Special (2022)
      3,    // Doing Me (2022)
      5,    // 5 Mo (2022)
      6,    // Moved South (2022)
      179,  // Life Goes On (2022)
      180,  // Piece of Mind (2020)
      181,  // Power To The People ft. Chairman Fred Hampton Jr (2021)
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
      100,  // Favorite Person (150 BPM, hitScore 95)
      505,  // No Weapon (hitScore 95)
      500,  // I Want This One (hitScore 94)
      511,  // Never Let The Money (hitScore 94)
      190,  // Do What WE Do (hitScore 94)
      186,  // Prayed 4 Tonight (hitScore 93)
      189,  // I Don't Wanna (hitScore 93)
      503,  // Be Alright (hitScore 93)
      506,  // I Been On Some Shit (hitScore 93)
      188,  // Terry Pettis Story (hitScore 92)
    ]
  }
];
