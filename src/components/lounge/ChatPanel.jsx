/**
 * KICKBACK LOUNGE — Chat Panel
 * Collapsible chat with messages + quick emotes
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { EMOTES } from '@/lib/games/constants';
import { Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import QuickEmotes from './QuickEmotes';

export default function ChatPanel() {
  const [text, setText] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const { messages, sendMessage, sendEmote, myPlayerId } = useGameStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] transition"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-white/50" />
          <span className="text-white/70 text-sm font-medium">Chat</span>
          {messages.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </div>
        {collapsed ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
      </button>

      {!collapsed && (
        <>
          {/* Messages */}
          <div className="flex-1 max-h-48 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-white/20 text-xs text-center py-4">No messages yet</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.senderId === myPlayerId ? 'justify-end' : ''}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                    msg.senderId === myPlayerId
                      ? 'bg-blue-500/20 text-blue-100'
                      : 'bg-white/5 text-white/80'
                  }`}
                >
                  {msg.senderId !== myPlayerId && (
                    <span className="text-xs text-white/40 block">{msg.sender}</span>
                  )}
                  {msg.emote ? (
                    <span className="text-2xl">{EMOTES.find(e => e.id === msg.emote)?.emoji || msg.emote}</span>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Emotes */}
          <QuickEmotes onEmote={sendEmote} />

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-white/5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 transition disabled:opacity-30"
            >
              <Send size={16} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
