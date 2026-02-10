/**
 * MYSTATION - Social Media Embeds
 * Instagram + TikTok feeds for cross-pollination
 */

'use client';

import { useState } from 'react';
import { Instagram, Music2, ExternalLink } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/mikepagemusic';
const TIKTOK_URL = 'https://www.tiktok.com/@mikepagemusic';

const socialPosts = [
  { platform: 'instagram', label: '@mikepagemusic', url: INSTAGRAM_URL },
  { platform: 'tiktok', label: '@mikepagemusic', url: TIKTOK_URL },
];

export default function SocialEmbeds({ className = '' }) {
  const [activeTab, setActiveTab] = useState('instagram');

  return (
    <div className={`glass rounded-2xl border border-white/10 overflow-hidden ${className}`}>
      {/* Tab Header */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('instagram')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition ${
            activeTab === 'instagram' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Instagram size={16} />
          Instagram
        </button>
        <button
          onClick={() => setActiveTab('tiktok')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition ${
            activeTab === 'tiktok' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Music2 size={16} />
          TikTok
        </button>
      </div>

      {/* Content */}
      <div className="p-6 text-center">
        {activeTab === 'instagram' ? (
          <div>
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center">
              <Instagram size={36} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">@mikepagemusic</h3>
            <p className="text-white/50 text-sm mb-4">Behind the scenes, studio sessions, and LOTL updates</p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-bold rounded-xl hover:opacity-90 transition"
            >
              Follow on Instagram
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 mx-auto mb-4 bg-black rounded-2xl flex items-center justify-center border border-white/20">
              <Music2 size={36} className="text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">@mikepagemusic</h3>
            <p className="text-white/50 text-sm mb-4">Music clips, freestyles, and event highlights</p>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition"
            >
              Follow on TikTok
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
