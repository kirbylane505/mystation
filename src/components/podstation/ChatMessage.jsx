'use client';

import { useState } from 'react';
import { User, ExternalLink, Crown } from 'lucide-react';

export default function ChatMessage({ msg, isSubscriber }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const isEmoji = msg.emoji && !msg.message;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full text-left px-3 py-1.5 hover:bg-white/5 rounded transition-colors"
      >
        {isEmoji ? (
          <span className="text-sm">
            {msg.isSubscriber && <Crown className="w-3 h-3 text-yellow-400 inline mr-1" />}
            <span
              data-tier={msg.isSubscriber ? 'premium' : 'free'}
              className={`font-medium ${msg.isSubscriber ? 'text-yellow-400' : 'text-orange-400'}`}
            >{msg.user_name}</span>
            <span className="ml-2 text-lg">{msg.emoji}</span>
          </span>
        ) : (
          <p className="text-sm break-words">
            {msg.isSubscriber && <Crown className="w-3 h-3 text-yellow-400 inline mr-1" />}
            <span
              data-tier={msg.isSubscriber ? 'premium' : 'free'}
              className={`font-medium ${msg.isSubscriber ? 'text-yellow-400' : 'text-orange-400'}`}
            >{msg.user_name}</span>
            <span className="text-gray-300 ml-2">{msg.message}</span>
          </p>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute left-3 bottom-full mb-1 bg-mystation-navy border border-white/10 rounded-lg p-3 shadow-xl z-50 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{msg.user_name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" />
              View Profile
            </button>
          </div>
        </>
      )}
    </div>
  );
}
