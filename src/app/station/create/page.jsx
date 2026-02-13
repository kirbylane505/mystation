'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStationStore } from '@/store/stationStore';
import { useUserStore } from '@/store/playerStore';
import { STATION_CATEGORIES } from '@/lib/stationCategories';
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Music, ShoppingBag,
  ListMusic, User, Link as LinkIcon, DollarSign, Palette, Mail,
  Instagram, Twitter, Youtube, Globe, Crown, Heart, Shield,
  Upload, BarChart3, Users, Zap, CheckCircle
} from 'lucide-react';

export default function CreateStationPage() {
  const router = useRouter();
  const { isLoggedIn, isSubscribed } = useUserStore();
  const {
    setupStep,
    stationData,
    setCategory,
    setProfile,
    addProduct,
    addPlaylist,
    setTipsEnabled,
    completeSetup,
    goToStep,
    startSetup
  } = useStationStore();

  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    website: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill form with existing data
  useEffect(() => {
    if (stationData) {
      setFormData({
        username: stationData.username || '',
        displayName: stationData.displayName || '',
        bio: stationData.bio || '',
        instagram: stationData.socialLinks?.instagram || '',
        twitter: stationData.socialLinks?.twitter || '',
        tiktok: stationData.socialLinks?.tiktok || '',
        youtube: stationData.socialLinks?.youtube || '',
        website: stationData.socialLinks?.website || ''
      });
    }
  }, [stationData]);

  if (!mounted) return null;

  const steps = [
    { num: 1, name: 'Category', icon: Sparkles },
    { num: 2, name: 'Profile', icon: User },
    { num: 3, name: 'Products', icon: ShoppingBag },
    { num: 4, name: 'Playlists', icon: ListMusic },
    { num: 5, name: 'Launch', icon: Crown }
  ];

  const features = [
    { icon: Globe, title: "Your Own Station", desc: "yourname.mystation.app" },
    { icon: ShoppingBag, title: "Sell Products", desc: "Digital, physical, services" },
    { icon: ListMusic, title: "Create Playlists", desc: "Mix any music source" },
    { icon: DollarSign, title: "Keep 100%", desc: "Direct to your account" },
    { icon: Users, title: "Own Your Fans", desc: "No algorithm gatekeeping" },
    { icon: BarChart3, title: "Full Analytics", desc: "See who's buying" }
  ];

  const handleStartSetup = () => {
    startSetup();
  };

  const handleCategorySelect = (category) => {
    setCategory(category);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfile({
      username: formData.username.toLowerCase().replace(/[^a-z0-9]/g, ''),
      displayName: formData.displayName,
      bio: formData.bio,
      socialLinks: {
        instagram: formData.instagram,
        twitter: formData.twitter,
        tiktok: formData.tiktok,
        youtube: formData.youtube,
        website: formData.website
      }
    });
  };

  const handleSkipProducts = () => goToStep(4);
  const handleSkipPlaylists = () => goToStep(5);

  const handleLaunch = () => {
    completeSetup();
    router.push(`/station/${stationData.username}`);
  };

  // LANDING / HERO (Step 0)
  const HeroSection = () => (
    <div className="min-h-screen">
      {/* Excited Stream at LOTL CTA */}
      <section className="relative py-6 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative bg-gradient-to-r from-green-600/30 via-emerald-500/20 to-green-600/30 rounded-2xl border border-green-500/30 p-6 md:p-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_70%)]" />
            <div className="relative">
              <span className="text-3xl mb-2 block">🎪🔥🎶</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Stream at <span className="text-green-400">Love on the Lawn!</span>
              </h2>
              <p className="text-white/70 text-sm md:text-base mb-4 max-w-xl mx-auto">
                Become a streamer on MyStation and get a chance to perform or stream LIVE at the Love on the Lawn Festival! 10,000+ attendees, major sponsors, real exposure.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="mailto:mystationlive@gmail.com?subject=I%20Want%20to%20Stream%20at%20LOTL!"
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center gap-2"
                >
                  <Mail size={18} />
                  Apply Now — mystationlive@gmail.com
                </a>
                <Link
                  href="/lotl"
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition"
                >
                  Learn About LOTL
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30 mb-6">
            <Sparkles size={16} className="text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">For Creators</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Build Your Own<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Creator World</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            God gave you the gift, not to pay a machine.
          </p>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10">
            Musicians, hair stylists, artists, coaches - anyone can build their station.
            Sell products, create playlists, connect with fans. Keep 100% of what you earn.
          </p>

          <button
            onClick={handleStartSetup}
            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-3 mx-auto"
          >
            Create Your Station
            <ArrowRight size={24} />
          </button>

          <p className="text-white/40 text-sm mt-4">Free to start • Subscription tiers available</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Everything You Need</h2>
        <p className="text-white/50 text-center mb-12">Your station, your rules, your money</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 transition">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
                <feature.icon size={28} className="text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Station Categories Preview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Pick Your Category</h2>
        <p className="text-white/50 text-center mb-12">What kind of station are you creating?</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {STATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { startSetup(); setTimeout(() => handleCategorySelect(cat), 100); }}
              className="p-6 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl mb-3">{cat.icon}</div>
              <h3 className="font-semibold text-white mb-1 text-sm">{cat.name}</h3>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleStartSetup}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 mx-auto"
          >
            Get Started <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center">
          <Heart size={48} className="text-blue-400 mx-auto mb-4" />
          <blockquote className="text-2xl text-white font-medium mb-6 leading-relaxed">
            "Every creator deserves their own station. Build your world, connect with your fans, keep what you earn."
          </blockquote>
          <p className="text-blue-400 font-bold">— Mike Page</p>
          <p className="text-white/40 text-sm">Founder, MyStation</p>
        </div>
      </section>
    </div>
  );

  // Step 1: Category Selection
  const CategoryStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white mb-4">
          What type of station are you creating?
        </h1>
        <p className="text-white/60 text-lg">
          Choose your category to customize your station experience
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat)}
            className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
              stationData.category?.id === cat.id
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/30'
            }`}
          >
            <div className="text-4xl mb-3">{cat.icon}</div>
            <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
            <p className="text-xs text-white/50">{cat.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Profile Setup
  const ProfileStep = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">{stationData.category?.icon}</div>
        <h1 className="text-4xl font-bold text-white mb-4">Set up your profile</h1>
        <p className="text-white/60">Tell fans who you are</p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div>
          <label className="block text-white/70 text-sm mb-2">Station Username</label>
          <div className="flex items-center">
            <span className="bg-white/10 px-4 py-3 rounded-l-xl text-white/50">mystation.app/</span>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="yourname"
              className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Display Name</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Your Name or Brand"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell your fans about yourself..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <LinkIcon size={18} /> Social Links
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Instagram size={18} className="text-pink-400" />
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="Instagram username"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Twitter size={18} className="text-blue-400" />
              <input
                type="text"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="Twitter/X username"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Youtube size={18} className="text-red-500" />
              <input
                type="text"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="YouTube channel"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-green-400" />
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="Website URL"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          Continue <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );

  // Step 3: Products
  const ProductsStep = () => {
    const [newProduct, setNewProduct] = useState({
      name: '',
      price: '',
      description: '',
      type: 'digital'
    });

    const handleAddProduct = (e) => {
      e.preventDefault();
      if (newProduct.name && newProduct.price) {
        addProduct({
          ...newProduct,
          price: parseFloat(newProduct.price)
        });
        setNewProduct({ name: '', price: '', description: '', type: 'digital' });
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <ShoppingBag className="mx-auto text-blue-400 mb-4" size={48} />
          <h1 className="text-4xl font-bold text-white mb-4">Add your products</h1>
          <p className="text-white/60">Sell digital products, physical items, or services</p>
        </div>

        {stationData.products.length > 0 && (
          <div className="mb-8 space-y-3">
            {stationData.products.map((product) => (
              <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{product.name}</h4>
                  <p className="text-white/50 text-sm">{product.type}</p>
                </div>
                <span className="text-green-400 font-semibold">${product.price}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddProduct} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Product Name</label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="e.g., Hair Care Bundle, Beat Pack, Coaching Session"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                placeholder="29.99"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Type</label>
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="digital">Digital Product</option>
                <option value="physical">Physical Item</option>
                <option value="service">Service/Booking</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Description</label>
            <textarea
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              placeholder="Describe your product..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-500/20 border border-blue-500 text-blue-400 rounded-xl font-semibold hover:bg-blue-500/30 transition"
          >
            + Add Product
          </button>
        </form>

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSkipProducts}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-white/70 font-semibold hover:bg-white/10 transition"
          >
            Skip for now
          </button>
          <button
            onClick={() => goToStep(4)}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Step 4: Playlists
  const PlaylistsStep = () => {
    const [newPlaylist, setNewPlaylist] = useState({
      name: '',
      description: ''
    });

    const handleAddPlaylist = (e) => {
      e.preventDefault();
      if (newPlaylist.name) {
        addPlaylist(newPlaylist);
        setNewPlaylist({ name: '', description: '' });
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <ListMusic className="mx-auto text-purple-400 mb-4" size={48} />
          <h1 className="text-4xl font-bold text-white mb-4">Create playlists</h1>
          <p className="text-white/60">Curate music from any source - Spotify, Apple Music, YouTube, or MyStation</p>
        </div>

        {stationData.playlists.length > 0 && (
          <div className="mb-8 space-y-3">
            {stationData.playlists.map((playlist) => (
              <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{playlist.name}</h4>
                  <p className="text-white/50 text-sm">{playlist.tracks?.length || 0} tracks</p>
                </div>
                <Music size={20} className="text-purple-400" />
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddPlaylist} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Playlist Name</label>
            <input
              type="text"
              value={newPlaylist.name}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
              placeholder="e.g., Salon Vibes, Workout Hits, Chill Study"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Description</label>
            <textarea
              value={newPlaylist.description}
              onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
              placeholder="What's this playlist for?"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-purple-500/20 border border-purple-500 text-purple-400 rounded-xl font-semibold hover:bg-purple-500/30 transition"
          >
            + Create Playlist
          </button>

          <p className="text-center text-white/40 text-sm">
            You can add tracks from Spotify, Apple Music, YouTube, or MyStation after launch
          </p>
        </form>

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSkipPlaylists}
            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-white/70 font-semibold hover:bg-white/10 transition"
          >
            Skip for now
          </button>
          <button
            onClick={() => goToStep(5)}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // Step 5: Launch
  const LaunchStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-10">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
          <Crown size={48} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Ready to launch!</h1>
        <p className="text-white/60 text-lg">Your station is ready to go live</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{stationData.category?.icon}</div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-white">{stationData.displayName || 'Your Station'}</h2>
            <p className="text-white/50">mystation.app/{stationData.username || 'username'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center border-t border-white/10 pt-6">
          <div>
            <p className="text-2xl font-bold text-white">{stationData.products.length}</p>
            <p className="text-white/50 text-sm">Products</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stationData.playlists.length}</p>
            <p className="text-white/50 text-sm">Playlists</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stationData.category?.name || 'Custom'}</p>
            <p className="text-white/50 text-sm">Category</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mb-8">
        <p className="text-yellow-200 text-sm">
          <DollarSign className="inline-block mr-1" size={16} />
          Enable tips and start earning from day one! You can set this up in your dashboard.
        </p>
      </div>

      <button
        onClick={handleLaunch}
        className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold text-xl flex items-center justify-center gap-3 hover:opacity-90 transition shadow-lg shadow-green-500/30"
      >
        <Sparkles size={24} />
        Launch My Station
      </button>
    </div>
  );

  const renderStep = () => {
    switch (setupStep) {
      case 0: return <HeroSection />;
      case 1: return <CategoryStep />;
      case 2: return <ProfileStep />;
      case 3: return <ProductsStep />;
      case 4: return <PlaylistsStep />;
      case 5: return <LaunchStep />;
      default: return <HeroSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black">
      {/* Progress Steps - only show after starting */}
      {setupStep > 0 && (
        <div className="max-w-4xl mx-auto pt-12 px-4 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => step.num < setupStep && goToStep(step.num)}
                  disabled={step.num > setupStep}
                  className={`flex flex-col items-center ${step.num <= setupStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                    step.num < setupStep
                      ? 'bg-green-500 text-white'
                      : step.num === setupStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {step.num < setupStep ? (
                      <Check size={20} />
                    ) : (
                      <step.icon size={20} />
                    )}
                  </div>
                  <span className={`text-xs ${step.num <= setupStep ? 'text-white' : 'text-white/40'}`}>
                    {step.name}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 md:w-24 h-0.5 mx-2 ${
                    step.num < setupStep ? 'bg-green-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className={setupStep > 0 ? 'px-4 pb-12' : ''}>
        {renderStep()}
      </div>

      {/* Back Button - only show after step 1 */}
      {setupStep > 1 && (
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <button
            onClick={() => goToStep(setupStep - 1)}
            className="text-white/50 hover:text-white flex items-center gap-2 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
