'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useStationStore } from '@/store/stationStore';
import { usePlayerStore } from '@/store/playerStore';
import { getCategoryById } from '@/lib/stationCategories';
import {
  Music, ShoppingBag, ListMusic, Heart, Share2, DollarSign,
  Instagram, Twitter, Youtube, Globe, ExternalLink, Play, Users,
  Star, MessageCircle, Crown
} from 'lucide-react';
import Link from 'next/link';

export default function StationPage() {
  const params = useParams();
  const { username } = params;
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

  // Get station data - in production this would fetch from database
  const { station, stationData, isCreator } = useStationStore();
  const { setQueue } = usePlayerStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Check if viewing own station or find station by username
  const viewingStation = station?.username === username ? station : stationData?.username === username ? stationData : null;

  // Demo station for preview
  const demoStation = !viewingStation ? {
    username: username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1) + "'s Station",
    category: getCategoryById('other'),
    bio: 'Welcome to my station! This is where I share my products, playlists, and connect with fans.',
    avatar: '',
    socialLinks: {},
    products: [],
    playlists: [],
    tips: { enabled: true, amounts: [5, 10, 25, 50] },
    stats: { followers: 0, totalSales: 0, totalStreams: 0 }
  } : null;

  const currentStation = viewingStation || demoStation;
  const category = currentStation.category || getCategoryById('other');

  const tabs = [
    { id: 'products', name: 'Products', icon: ShoppingBag, count: currentStation.products?.length || 0 },
    { id: 'playlists', name: 'Playlists', icon: ListMusic, count: currentStation.playlists?.length || 0 },
    { id: 'about', name: 'About', icon: Users }
  ];

  const TipModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-mystation-navy border border-white/10 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Send a Tip</h3>
        <p className="text-white/60 text-center mb-6">Support {currentStation.displayName}</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {(currentStation.tips?.amounts || [5, 10, 25, 50]).map((amount) => (
            <button
              key={amount}
              className="py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-green-500/20 hover:border-green-500 transition"
            >
              ${amount}
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Custom amount"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-green-500"
        />

        <button className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold hover:opacity-90 transition">
          Send Tip
        </button>

        <button
          onClick={() => setShowTipModal(false)}
          className="w-full py-3 text-white/50 hover:text-white transition mt-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black">
      {/* Cover & Profile Header */}
      <div className={`relative h-64 bg-gradient-to-r ${category.color}`}>
        <div className="absolute inset-0 bg-black/30" />

        {/* Profile Card */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
          <div className="bg-mystation-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto -mt-18 mb-4 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center border-4 border-mystation-navy text-5xl relative -top-12">
              {category.icon}
            </div>

            <div className="-mt-8">
              <h1 className="text-2xl font-bold text-white">{currentStation.displayName}</h1>
              <p className="text-white/50 text-sm mb-2">@{currentStation.username}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${category.color} text-white`}>
                {category.name}
              </span>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 my-4 py-4 border-y border-white/10">
              <div>
                <p className="text-xl font-bold text-white">{currentStation.stats?.followers || 0}</p>
                <p className="text-white/50 text-xs">Followers</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{currentStation.products?.length || 0}</p>
                <p className="text-white/50 text-xs">Products</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{currentStation.playlists?.length || 0}</p>
                <p className="text-white/50 text-xs">Playlists</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  isFollowing
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Heart size={18} fill={isFollowing ? 'currentColor' : 'none'} />
                {isFollowing ? 'Following' : 'Follow'}
              </button>

              {currentStation.tips?.enabled && (
                <button
                  onClick={() => setShowTipModal(true)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                >
                  <DollarSign size={18} />
                  Tip
                </button>
              )}

              <button className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="pt-28 pb-4">
        <div className="flex justify-center gap-4">
          {currentStation.socialLinks?.instagram && (
            <a href={`https://instagram.com/${currentStation.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full hover:bg-pink-500/20 transition">
              <Instagram size={20} className="text-pink-400" />
            </a>
          )}
          {currentStation.socialLinks?.twitter && (
            <a href={`https://twitter.com/${currentStation.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full hover:bg-blue-500/20 transition">
              <Twitter size={20} className="text-blue-400" />
            </a>
          )}
          {currentStation.socialLinks?.youtube && (
            <a href={`https://youtube.com/${currentStation.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full hover:bg-red-500/20 transition">
              <Youtube size={20} className="text-red-500" />
            </a>
          )}
          {currentStation.socialLinks?.website && (
            <a href={currentStation.socialLinks.website} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-full hover:bg-green-500/20 transition">
              <Globe size={20} className="text-green-400" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-2 border-b border-white/10 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-white border-blue-500'
                  : 'text-white/50 border-transparent hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.name}
              {tab.count !== undefined && (
                <span className="ml-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pb-32">
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              {currentStation.products?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentStation.products.map((product) => (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group">
                      <div className="h-48 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-white/20" />
                      </div>
                      <div className="p-5">
                        <span className="text-xs text-blue-400 uppercase tracking-wide">{product.type}</span>
                        <h3 className="text-lg font-semibold text-white mt-1">{product.name}</h3>
                        <p className="text-white/50 text-sm mt-1 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-xl font-bold text-green-400">${product.price}</span>
                          <button className="px-4 py-2 bg-blue-500 rounded-lg text-white text-sm font-medium hover:bg-blue-600 transition">
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ShoppingBag size={48} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No products yet</p>
                </div>
              )}
            </div>
          )}

          {/* Playlists Tab */}
          {activeTab === 'playlists' && (
            <div>
              {currentStation.playlists?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentStation.playlists.map((playlist) => (
                    <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition group">
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl flex items-center justify-center shrink-0">
                          <Music size={32} className="text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                          <p className="text-white/50 text-sm mt-1">{playlist.description}</p>
                          <p className="text-white/30 text-xs mt-2">{playlist.tracks?.length || 0} tracks</p>
                        </div>
                        <button className="p-3 bg-blue-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition">
                          <Play size={18} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <ListMusic size={48} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">No playlists yet</p>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">About</h3>
                <p className="text-white/70 leading-relaxed">
                  {currentStation.bio || 'No bio yet'}
                </p>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white/50 mb-3">CATEGORY</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <p className="text-white font-medium">{category.name}</p>
                      <p className="text-white/50 text-sm">{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white/50 mb-3">FEATURES</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.features?.map((feature, i) => (
                      <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-white/70 text-sm">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && <TipModal />}

      {/* Create Station CTA for visitors */}
      {!viewingStation && (
        <div className="fixed bottom-24 left-0 right-0 px-4">
          <div className="max-w-lg mx-auto">
            <Link
              href="/station/create"
              className="block w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold text-center hover:opacity-90 transition shadow-lg"
            >
              <Crown className="inline-block mr-2" size={18} />
              Create Your Own Station
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
