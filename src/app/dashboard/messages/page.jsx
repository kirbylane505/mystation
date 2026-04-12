'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function getEmail() {
  return decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function DashboardMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [myId, setMyId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const email = getEmail();
    if (!email) return;
    try {
      const res = await fetch(`/api/creators/messages?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.conversations) setConversations(data.conversations);
      if (data.myId) setMyId(data.myId);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load thread messages
  const loadThread = useCallback(async (partnerId) => {
    const email = getEmail();
    if (!email || !partnerId) return;
    try {
      const res = await fetch(
        `/api/creators/messages?email=${encodeURIComponent(email)}&withCreatorId=${partnerId}`
      );
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.myId) setMyId(data.myId);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to load thread:', err);
    } finally {
      setThreadLoading(false);
    }
  }, [scrollToBottom]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Poll for new messages when in a thread
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedPartner) {
      pollRef.current = setInterval(() => {
        loadThread(selectedPartner.id);
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedPartner, loadThread]);

  // Select a conversation
  const selectConversation = (conv) => {
    setSelectedPartner(conv.partner);
    setThreadLoading(true);
    setMessages([]);
    loadThread(conv.partnerId);
  };

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedPartner) return;

    setSending(true);
    const email = getEmail();
    try {
      const res = await fetch('/api/creators/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          receiverId: selectedPartner.id,
          message: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage('');
        await loadThread(selectedPartner.id);
        loadConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Back button for mobile
  const handleBack = () => {
    setSelectedPartner(null);
    setMessages([]);
    if (pollRef.current) clearInterval(pollRef.current);
    loadConversations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[400px]">
        {/* Left Panel — Conversation List */}
        <div
          className={`w-full lg:w-80 lg:flex-shrink-0 bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col ${
            selectedPartner ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#27272a]">
            <p className="text-sm font-semibold text-[#a1a1aa]">Conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <svg className="w-12 h-12 text-[#27272a] mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25z" />
                </svg>
                <p className="text-[#71717a] text-sm">
                  No messages yet. Connect with other creators on MyStation!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-[#27272a] last:border-b-0 ${
                    selectedPartner?.id === conv.partnerId
                      ? 'bg-[#D4AF37]/10'
                      : 'hover:bg-[#09090b]'
                  }`}
                >
                  {/* Avatar */}
                  {conv.partner?.avatar_url ? (
                    <img
                      src={conv.partner.avatar_url}
                      alt={conv.partner.display_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[#27272a]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-[#71717a]">
                        {(conv.partner?.display_name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">
                        {conv.partner?.display_name || 'Unknown'}
                      </p>
                      <span className="text-xs text-[#52525b] flex-shrink-0 ml-2">
                        {timeAgo(conv.lastMessage.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717a] truncate mt-0.5">
                      {conv.lastMessage.sender_id === myId ? 'You: ' : ''}
                      {conv.lastMessage.message}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-[#D4AF37] text-black text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel — Message Thread */}
        <div
          className={`flex-1 bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex flex-col ${
            selectedPartner ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedPartner ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center gap-3 p-4 border-b border-[#27272a]">
                <button
                  onClick={handleBack}
                  className="lg:hidden text-[#a1a1aa] hover:text-white transition-colors mr-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {selectedPartner.avatar_url ? (
                  <img
                    src={selectedPartner.avatar_url}
                    alt={selectedPartner.display_name}
                    className="w-8 h-8 rounded-full object-cover border border-[#27272a]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#71717a]">
                      {(selectedPartner.display_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-white">{selectedPartner.display_name}</p>
                  <p className="text-xs text-[#52525b]">/{selectedPartner.slug}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[#71717a] text-sm">Start the conversation...</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === myId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? 'bg-[#D4AF37] text-black rounded-br-md'
                              : 'bg-[#27272a] text-white rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? 'text-black/50' : 'text-[#52525b]'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-[#27272a]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white text-sm placeholder-[#52525b] focus:border-[#D4AF37] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="px-5 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all text-sm"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-16 h-16 text-[#27272a] mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              <p className="text-[#71717a] text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
