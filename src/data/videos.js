/**
 * MIKE PAGE - VIDEO CATALOG
 * MyStation - YouTube Videos with Internal View Tracking
 *
 * Add videos from YouTube channel: https://youtube.com/@mikepage
 * Internal views are tracked separately from YouTube stats
 */

export const videos = [
  {
    id: 'v1',
    title: "LOTL Anthem - Official Video",
    youtubeId: 'u1qUeN3tabY', // From The Town video ID found in tracks
    description: "Love on the Lawn Festival official anthem. Celebrating community and unity in Elgin, IL.",
    category: 'music-video',
    year: 2024,
    featured: true,
    thumbnail: null // Will auto-generate from YouTube
  },
  {
    id: 'v2',
    title: "Love on the Lawn 2024 Recap",
    youtubeId: null, // Add YouTube ID when available
    description: "Highlights from the 3rd annual Love on the Lawn festival in downtown Elgin.",
    category: 'behind-the-scenes',
    year: 2024,
    featured: true,
    thumbnail: null
  },
  {
    id: 'v3',
    title: "Cindy's Son - Album Documentary",
    youtubeId: null, // Add YouTube ID when available
    description: "The making of the debut album dedicated to Mike's mother.",
    category: 'documentary',
    year: 2022,
    featured: false,
    thumbnail: null
  },
  {
    id: 'v4',
    title: "Shezzy Knew It - Studio Session",
    youtubeId: null, // Add YouTube ID when available
    description: "Behind the scenes of the Shezzy Knew It EP recording sessions.",
    category: 'behind-the-scenes',
    year: 2024,
    featured: true,
    thumbnail: null
  },
  {
    id: 'v5',
    title: "Rich Off Rags - Lyric Video",
    youtubeId: null, // Add YouTube ID when available
    description: "Official lyric video for Rich Off Rags from Cindy's Son.",
    category: 'music-video',
    year: 2022,
    featured: false,
    thumbnail: null
  },
  {
    id: 'v6',
    title: "They Know ft. Murrille - Official Video",
    youtubeId: null, // Add YouTube ID when available
    description: "Official music video for They Know featuring Murrille.",
    category: 'music-video',
    year: 2023,
    featured: true,
    thumbnail: null
  }
];

export const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'music-video', label: 'Music Videos' },
  { id: 'behind-the-scenes', label: 'Behind the Scenes' },
  { id: 'documentary', label: 'Documentaries' },
  { id: 'live', label: 'Live Performances' },
  { id: 'interview', label: 'Interviews' }
];

// Channel info for linking
export const youtubeChannel = {
  url: 'https://youtube.com/@mikepage',
  name: '@mikepage',
  description: 'Official Mike Page YouTube Channel'
};
