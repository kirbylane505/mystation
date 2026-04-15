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
  // Drops extracted from Mike Page catalog intros (first 4-6s of named tracks).
  // Replace these with custom IDMG vocal tag files anytime — just upload to
  // R2 bucket root and update the URL here.
  { id: 'drop-01', title: 'Fantasy Drop',        audioFile: `${R2_BASE}idmg-drop-01.m4a`, duration: '0:04' },
  { id: 'drop-02', title: 'Please Don\u2019t Drop', audioFile: `${R2_BASE}idmg-drop-02.m4a`, duration: '0:04' },
  { id: 'drop-03', title: 'IDMG 305 Vinyl Drop', audioFile: `${R2_BASE}idmg-drop-03.m4a`, duration: '0:06' },
  { id: 'drop-04', title: 'It Was A Dream Drop', audioFile: `${R2_BASE}idmg-drop-04.m4a`, duration: '0:04' },
  { id: 'drop-05', title: 'Favorite Person Drop',audioFile: `${R2_BASE}idmg-drop-05.m4a`, duration: '0:04' },
  { id: 'drop-06', title: 'Lizzo Drop',          audioFile: `${R2_BASE}idmg-drop-06.m4a`, duration: '0:04' },
];

// Insert a drop every N real tracks. 4 = drop every 5 slots (4 tracks + 1 drop)
export const DROPS_EVERY_N = 4;
