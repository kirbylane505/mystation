/**
 * MYSTATION - Track Upload Page
 * Artists upload their music here
 */

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload, Music, Image as ImageIcon, X, CheckCircle,
  ArrowLeft, Plus, Loader2, FileAudio, AlertCircle
} from 'lucide-react';

export default function UploadTrackPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [trackInfo, setTrackInfo] = useState({
    title: '',
    album: '',
    year: new Date().getFullYear(),
    genre: 'R&B',
    featured: '',
    bpm: '',
    key: ''
  });

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/flac'];
    if (validTypes.includes(file.type) || file.name.match(/\.(wav|mp3|flac|m4a)$/i)) {
      setUploadedFile(file);
      // Auto-fill title from filename
      const title = file.name.replace(/\.(wav|mp3|flac|m4a)$/i, '').replace(/_/g, ' ');
      setTrackInfo(prev => ({ ...prev, title }));
    } else {
      alert('Please upload a WAV, MP3, FLAC, or M4A file');
    }
  };

  const handleImageFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedFile || !trackInfo.title) return;

    setUploading(true);

    // Simulate upload - in production this would upload to cloud storage
    await new Promise(resolve => setTimeout(resolve, 2000));

    setUploading(false);
    setUploaded(true);
  };

  const genres = ['R&B', 'Hip-Hop', 'Soul', 'Pop', 'Gospel', 'Jazz', 'Other'];
  const keys = ['C Major', 'C Minor', 'D Major', 'D Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'G Major', 'G Minor', 'A Major', 'A Minor', 'B Major', 'B Minor'];

  if (uploaded) {
    return (
      <div className="min-h-screen bg-mystation-darker flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-10 max-w-md w-full text-center border border-green-500/20">
          <CheckCircle size={80} className="text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Track Uploaded!</h2>
          <p className="text-white/60 mb-6">
            "{trackInfo.title}" has been added to your station.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/artists/dashboard"
              className="w-full py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => {
                setUploaded(false);
                setUploadedFile(null);
                setCoverImage(null);
                setTrackInfo({
                  title: '',
                  album: '',
                  year: new Date().getFullYear(),
                  genre: 'R&B',
                  featured: '',
                  bpm: '',
                  key: ''
                });
              }}
              className="w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mystation-darker">
      {/* Header */}
      <header className="border-b border-white/10 bg-mystation-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/artists/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft size={24} className="text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Upload Track</h1>
            <p className="text-white/50 text-sm">Add new music to your station</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Zone */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive
                ? 'border-green-500 bg-green-500/10'
                : uploadedFile
                ? 'border-green-500/50 bg-green-500/5'
                : 'border-white/20 hover:border-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadedFile ? (
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <FileAudio size={32} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{uploadedFile.name}</p>
                  <p className="text-white/50 text-sm">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={20} className="text-white/50" />
                </button>
              </div>
            ) : (
              <>
                <Upload size={48} className="text-white/30 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">Drag & drop your audio file</p>
                <p className="text-white/50 text-sm mb-4">WAV, MP3, FLAC, or M4A (max 500MB)</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
                >
                  Browse Files
                </button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,.flac,.m4a,audio/*"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Track Details */}
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Track Details</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="text-white/60 text-sm mb-2 block">Track Title *</label>
                <input
                  type="text"
                  value={trackInfo.title}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter track title"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              {/* Album */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Album (optional)</label>
                <input
                  type="text"
                  value={trackInfo.album}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, album: e.target.value }))}
                  placeholder="Album name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              {/* Featured Artist */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Featured Artist (optional)</label>
                <input
                  type="text"
                  value={trackInfo.featured}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, featured: e.target.value }))}
                  placeholder="ft. Artist Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Genre</label>
                <select
                  value={trackInfo.genre}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                >
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Year</label>
                <input
                  type="number"
                  value={trackInfo.year}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, year: e.target.value }))}
                  min="1900"
                  max="2030"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              {/* BPM */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">BPM (optional)</label>
                <input
                  type="number"
                  value={trackInfo.bpm}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, bpm: e.target.value }))}
                  placeholder="120"
                  min="40"
                  max="300"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              {/* Key */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">Key (optional)</label>
                <select
                  value={trackInfo.key}
                  onChange={(e) => setTrackInfo(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="">Select key</option>
                  {keys.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Cover Art */}
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">Cover Art (optional)</h3>
            <div className="flex items-start gap-6">
              <div
                onClick={() => imageInputRef.current?.click()}
                className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition ${
                  coverImage ? 'border-transparent' : 'border-white/20 hover:border-white/40'
                }`}
              >
                {coverImage ? (
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ImageIcon size={32} className="text-white/30" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white/60 text-sm mb-2">Upload album artwork</p>
                <p className="text-white/40 text-xs mb-4">Recommended: 1400x1400px, JPG or PNG</p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition"
                >
                  {coverImage ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && handleImageFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <AlertCircle size={16} />
              <span>You keep 100% of donations from fans</span>
            </div>
            <button
              type="submit"
              disabled={!uploadedFile || !trackInfo.title || uploading}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload Track
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
