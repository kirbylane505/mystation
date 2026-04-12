'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Flame } from 'lucide-react';
import { usePodStationStore } from '@/store/podStationStore';
import { useUserStore } from '@/store/playerStore';
import ChatMessage from './ChatMessage';

export default function LiveChat({ sendData, isSubscribed }) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);
  const { chatMessages, addChatMessage } = usePodStationStore();
  const { email, name } = useUserStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  function sendMessage(text, emoji = null) {
    if (!text && !emoji) return;
    const msg = {
      id: Date.now().toString(),
      user_name: name || email?.split('@')[0] || 'Anonymous',
      user_email: email,
      message: text || null,
      emoji: emoji || null,
      isSubscriber: isSubscribed || false,
      created_at: new Date().toISOString(),
    };

    if (sendData) {
      try {
        const encoder = new TextEncoder();
        sendData(encoder.encode(JSON.stringify(msg)));
      } catch (e) {
        console.error('Failed to send chat:', e);
      }
    }

    addChatMessage(msg);
    setMessage('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (message.trim()) sendMessage(message.trim());
  }

  return (
    <div className="flex flex-col h-full bg-mystation-darker/50 rounded-xl border border-white/10">
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-medium text-sm">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Chat is empty. Say something!</p>
        ) : (
          chatMessages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
        <button
          type="button"
          onClick={() => sendMessage(null, '🔥')}
          className="p-2 bg-white/5 hover:bg-orange-600/30 rounded-lg transition-colors flex-shrink-0"
          title="Send fire"
        >
          <Flame className="w-5 h-5 text-orange-500" />
        </button>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message..."
          maxLength={500}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500 min-w-0"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}
