'use client';

import { MessageCircle, Music, Calendar, Megaphone, ShoppingBag } from 'lucide-react';

const CHANNELS = [
  { id: 'general', label: 'General', icon: MessageCircle },
  { id: 'music', label: 'Music Talk', icon: Music },
  { id: 'events', label: 'LOTL / Events', icon: Calendar },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'merch', label: 'Merch', icon: ShoppingBag },
];

export { CHANNELS };

export default function ChannelTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 border-b border-white/10">
      {CHANNELS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
            active === id
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
