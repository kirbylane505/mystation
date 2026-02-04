/**
 * MYSTATION - Creator Station Categories
 * Users select their category when creating a station
 */

export const STATION_CATEGORIES = [
  {
    id: 'music',
    name: 'Music & Artist',
    icon: '🎵',
    description: 'Musicians, DJs, producers, bands',
    color: 'from-purple-500 to-pink-500',
    features: ['Music streaming', 'Playlists', 'Merch', 'Tips']
  },
  {
    id: 'beauty',
    name: 'Hair & Beauty',
    icon: '💇',
    description: 'Hair stylists, makeup artists, barbers',
    color: 'from-pink-500 to-rose-500',
    features: ['Product store', 'Booking links', 'Tutorials playlist', 'Tips']
  },
  {
    id: 'fashion',
    name: 'Fashion & Style',
    icon: '👗',
    description: 'Fashion designers, stylists, boutiques',
    color: 'from-amber-500 to-orange-500',
    features: ['Product store', 'Lookbook', 'Style playlists', 'Merch']
  },
  {
    id: 'fitness',
    name: 'Fitness & Wellness',
    icon: '💪',
    description: 'Trainers, coaches, yoga instructors',
    color: 'from-green-500 to-emerald-500',
    features: ['Programs', 'Workout playlists', 'Merch', 'Tips']
  },
  {
    id: 'art',
    name: 'Art & Creative',
    icon: '🎨',
    description: 'Artists, photographers, designers',
    color: 'from-blue-500 to-indigo-500',
    features: ['Art store', 'Portfolio', 'Creative playlists', 'Commissions']
  },
  {
    id: 'food',
    name: 'Food & Chef',
    icon: '🍳',
    description: 'Chefs, bakers, food creators',
    color: 'from-red-500 to-orange-500',
    features: ['Recipe products', 'Cooking playlists', 'Merch', 'Tips']
  },
  {
    id: 'education',
    name: 'Education & Coaching',
    icon: '📚',
    description: 'Teachers, tutors, life coaches',
    color: 'from-cyan-500 to-blue-500',
    features: ['Courses', 'Study playlists', 'Resources', 'Booking']
  },
  {
    id: 'business',
    name: 'Business & Consulting',
    icon: '💼',
    description: 'Consultants, entrepreneurs, mentors',
    color: 'from-slate-500 to-zinc-600',
    features: ['Services', 'Focus playlists', 'Resources', 'Booking']
  },
  {
    id: 'content',
    name: 'Content Creator',
    icon: '📱',
    description: 'YouTubers, streamers, podcasters',
    color: 'from-red-500 to-pink-500',
    features: ['Merch store', 'Playlists', 'Tips', 'Fan engagement']
  },
  {
    id: 'other',
    name: 'Other / Custom',
    icon: '✨',
    description: 'Create your own unique station',
    color: 'from-violet-500 to-purple-500',
    features: ['Full customization', 'All features available']
  }
];

export const getCategoryById = (id) => {
  return STATION_CATEGORIES.find(cat => cat.id === id) || STATION_CATEGORIES[9];
};

export const getCategoryColor = (id) => {
  const category = getCategoryById(id);
  return category?.color || 'from-blue-500 to-purple-500';
};
