/**
 * MYSTATION - Live Streaming & Video Creator Page
 * Mike can go live or upload videos
 */

'use client';

import { useState, useRef } from 'react';
import DonationButton from '@/components/DonationButton';
import { Radio, Users, Heart, MessageCircle, Send, Bell, Calendar, Video, Upload, Camera, X, Play, StopCircle, Sparkles } from 'lucide-react';

export default function LivePage() {
  const [chatMessage, setChatMessage] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true); // Mike Page admin mode
  const [showUpload, setShowUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Upcoming streams
  const upcomingStreams = [
    {
      id: 1,
      title: 'New Music Friday',
      date: 'Feb 7, 2026',
      time: '8:00 PM EST',
      description: 'Previewing unreleased tracks from the vault'
    },
    {
      id: 2,
      title: 'Motivation Monday',
      date: 'Feb 10, 2026',
      time: '12:00 PM EST',
      description: 'Weekly motivation talk and Q&A'
    },
    {
      id: 3,
      title: 'Studio Session',
      date: 'Feb 14, 2026',
      time: '9:00 PM EST',
      description: 'Behind the scenes of the new single'
    }
  ];

  const recentDonations = [
    { name: 'J***n', amount: 25, message: 'Keep inspiring!' },
    { name: 'A***a', amount: 10, message: 'Love from Chicago' },
    { name: 'M***e', amount: 50, message: 'For the Foundation' },
    { name: 'K***y', amount: 5, message: '' },
  ];

  // Start live stream
  const startLive = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsLive(true);
    } catch (err) {
      alert('Camera access needed to go live. Please allow camera and microphone access.');
    }
  };

  // Stop live stream
  const stopLive = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsLive(false);
  };

  // Start recording video
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setUploadedVideos(prev => [...prev, {
          id: Date.now(),
          title: streamTitle || 'New Recording',
          url,
          date: new Date().toLocaleDateString(),
          duration: '00:00'
        }]);
        setShowUpload(false);
        setStreamTitle('');
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Camera access needed. Please allow camera and microphone access.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsRecording(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedVideos(prev => [...prev, {
        id: Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        url,
        date: new Date().toLocaleDateString(),
        duration: '00:00'
      }]);
      setShowUpload(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Radio size={32} className="text-blue-400" />
              Go Live
            </h1>
            <p className="text-white/60">
              Stream live or create videos for your fans
            </p>
          </div>

          {/* Admin Controls */}
          {isAdmin && !isLive && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition border border-white/10"
              >
                <Video size={20} />
                Create Video
              </button>
              <button
                onClick={startLive}
                className="flex items-center gap-2 px-5 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition animate-glow-pulse"
              >
                <Radio size={20} />
                Go Live Now
              </button>
            </div>
          )}
        </div>

        {/* Video Upload/Record Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className="glass rounded-3xl p-8 max-w-2xl w-full animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create Video</h2>
                <button
                  onClick={() => {
                    setShowUpload(false);
                    if (isRecording) stopRecording();
                  }}
                  className="text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Video Title */}
              <input
                type="text"
                placeholder="Video title..."
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 mb-6"
              />

              {/* Preview */}
              <div className="aspect-video bg-black/50 rounded-2xl mb-6 overflow-hidden relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isRecording && !videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera size={48} className="text-white/30" />
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    RECORDING
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                {!isRecording ? (
                  <>
                    <button
                      onClick={startRecording}
                      className="flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
                    >
                      <Camera size={20} />
                      Record Video
                    </button>
                    <label className="flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition cursor-pointer">
                      <Upload size={20} />
                      Upload Video
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="col-span-2 flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    <StopCircle size={20} />
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isLive ? (
          /* LIVE VIEW */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted={false}
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Live badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  LIVE
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                  <Users size={14} />
                  1,234 watching
                </div>

                {/* Admin stop button */}
                {isAdmin && (
                  <button
                    onClick={stopLive}
                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-red-500/80 backdrop-blur text-white px-4 py-2 rounded-full font-bold hover:bg-red-600 transition"
                  >
                    <StopCircle size={18} />
                    End Stream
                  </button>
                )}
              </div>

              {/* Stream info */}
              <div className="glass rounded-xl p-4 mb-4">
                <h2 className="text-xl font-bold text-white mb-2">
                  {streamTitle || 'Mike Page Live Session'}
                </h2>
                <p className="text-white/60">
                  Mike Page is live right now - join the conversation!
                </p>
              </div>

              {/* Live donation button */}
              <div className="glass rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Support the Stream</h3>
                <p className="text-white/60 mb-4 text-sm">
                  Donations show on stream! 100% goes to Mike Page Foundation
                </p>
                <DonationButton variant="hero" />
              </div>
            </div>

            {/* Chat & Donations sidebar */}
            <div className="space-y-4">
              {/* Recent donations */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-blue-400" />
                  Recent Donations
                </h3>
                <div className="space-y-3">
                  {recentDonations.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-blue-500/10 rounded-lg animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        ${d.amount}
                      </div>
                      <div>
                        <p className="text-white font-medium">{d.name}</p>
                        {d.message && <p className="text-white/60 text-sm">{d.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="glass rounded-xl p-4 flex flex-col h-96">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={18} />
                  Live Chat
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  <div className="text-center text-white/40 text-sm py-8">
                    Chat messages appear here
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OFFLINE VIEW */
          <div>
            {/* Go Live Card */}
            {isAdmin && (
              <div className="glass rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Sparkles size={16} />
                      <span className="text-sm font-semibold uppercase tracking-wider">Ready to Stream</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Go Live to Your Fans</h2>
                    <p className="text-white/60">Start a live stream and connect with your audience in real-time</p>
                  </div>
                  <button
                    onClick={startLive}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/30"
                  >
                    <Radio size={24} />
                    Go Live
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Videos */}
            {uploadedVideos.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Your Videos</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {uploadedVideos.map(video => (
                    <div key={video.id} className="glass rounded-xl overflow-hidden hover:bg-white/10 transition cursor-pointer album-3d">
                      <div className="aspect-video bg-black relative">
                        <video src={video.url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                          <Play size={40} className="text-white" fill="white" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-white mb-1">{video.title}</h4>
                        <p className="text-white/60 text-sm">{video.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline banner */}
            <div className="glass rounded-2xl p-12 text-center mb-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Radio size={40} className="text-white/40" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Mike is Offline</h2>
              <p className="text-white/60 mb-6">
                Turn on notifications to know when Mike goes live
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-bold mx-auto hover:bg-blue-600 transition">
                <Bell size={18} />
                Notify Me When Live
              </button>
            </div>

            {/* Upcoming streams */}
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Streams</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {upcomingStreams.map((stream, i) => (
                <div
                  key={stream.id}
                  className="glass rounded-xl p-6 hover:bg-white/10 transition animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 text-blue-400 mb-3">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">{stream.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{stream.title}</h3>
                  <p className="text-white/60 text-sm mb-3">{stream.description}</p>
                  <p className="text-white/40 text-sm">{stream.time}</p>
                </div>
              ))}
            </div>

            {/* Past streams / VOD */}
            <h2 className="text-2xl font-bold text-white mb-6">Previous Streams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="glass rounded-xl overflow-hidden hover:bg-white/10 transition cursor-pointer album-3d animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-900/50 to-black flex items-center justify-center relative">
                    <span className="text-4xl">🎬</span>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      1:23:45
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-white mb-1">Studio Session #{i}</h4>
                    <p className="text-white/60 text-sm">Jan {20 + i}, 2026</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
