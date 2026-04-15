/**
 * MYSTATION RADIO — IDMG DROPS
 *
 * Short audio bumpers/tags inserted between tracks in the radio queue.
 * The station queue builder reads this list and interleaves a random drop
 * every DROPS_EVERY_N real tracks (default: 4).
 *
 * Drops should be 2–8 seconds. Ideal content:
 *   - "Impossible Dreamz Music Group" vocal tags
 *   - "Mike Page" idents
 *   - Airhorn/scratch/DJ-style bumpers
 *   - Vocal tags ripped from existing Mike Page tracks
 *
 * HOW TO ADD A DROP:
 *   1. Upload the audio file to R2 (flat bucket) at the root level:
 *      aws s3 cp drop.m4a s3://<bucket>/idmg-drop-01.m4a --endpoint-url <r2>
 *   2. Add an entry below with the full R2 URL
 *   3. Commit + deploy
 *
 * Format:
 *   { id, title, audioFile, duration }
 *
 * Set to empty array [] to disable drops.
 */

const R2_BASE = 'https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/';

export const radioDrops = [
  // Placeholder slots — replace URLs with real drop files as they're uploaded.
  // Uncomment entries after files are on R2.
  // { id: 'drop-01', title: 'IDMG Tag', audioFile: `${R2_BASE}idmg-drop-01.m4a`, duration: '0:04' },
  // { id: 'drop-02', title: 'IDMG Airhorn', audioFile: `${R2_BASE}idmg-drop-02.m4a`, duration: '0:03' },
  // { id: 'drop-03', title: 'Mike Page Ident', audioFile: `${R2_BASE}mp-drop-01.m4a`, duration: '0:05' },
];

// Insert a drop every N real tracks. 4 = drop every 5 slots (4 tracks + 1 drop)
export const DROPS_EVERY_N = 4;
