'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStationStore } from '@/store/stationStore';
import { getCategoryById } from '@/lib/stationCategories';
import {
  BarChart3, ShoppingBag, ListMusic, DollarSign, Users, Settings,
  Plus, Edit, Trash2, ExternalLink, Eye, TrendingUp, Music,
  Package, MessageCircle, Crown, ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const {
    station,
    stationData,
    isCreator,
    setupStep,
    addProduct,
    removeProduct,
    addPlaylist,
    removePlaylist,
    setTipsEnabled
  } = useStationStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Redirect to setup if not a creator yet
  if (!isCreator && setupStep < 5) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Crown size={64} className="mx-auto text-blue-400 mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Create Your Station</h1>
          <p className="text-white/60 mb-8">Set up your creator station to start selling products, sharing playlists, and connecting with fans.</p>
          <Link
            href="/station/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-semibold hover:opacity-90 transition"
          >
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const currentStation = station || stationData;
  const category = getCategoryById(currentStation?.category?.id);

  const stats = [
    { name: 'Followers', value: currentStation?.stats?.followers || 0, icon: Users, color: 'text-blue-400' },
    { name: 'Total Sales', value: `$${currentStation?.stats?.totalSales || 0}`, icon: DollarSign, color: 'text-green-400' },
    { name: 'Products', value: currentStation?.products?.length || 0, icon: Package, color: 'text-purple-400' },
    { name: 'Playlists', value: currentStation?.playlists?.length || 0, icon: Music, color: 'text-pink-400' }
  ];

  const navItems = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'products', name: 'Products', icon: ShoppingBag },
    { id: 'playlists', name: 'Playlists', icon: ListMusic },
    { id: 'earnings', name: 'Earnings', icon: DollarSign },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  // Add Product Form
  const ProductForm = () => {
    const [product, setProduct] = useState({
      name: '', price: '', description: '', type: 'digital'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (product.name && product.price) {
        addProduct({ ...product, price: parseFloat(product.price) });
        setProduct({ name: '', price: '', description: '', type: 'digital' });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Plus size={18} /> Add New Product
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Product name"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            placeholder="Price"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={product.type}
          onChange={(e) => setProduct({ ...product, type: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="digital">Digital Product</option>
          <option value="physical">Physical Item</option>
          <option value="service">Service/Booking</option>
        </select>
        <textarea
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          type="submit"
          className="w-full py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition"
        >
          Add Product
        </button>
      </form>
    );
  };

  // Add Playlist Form
  const PlaylistForm = () => {
    const [playlist, setPlaylist] = useState({ name: '', description: '' });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (playlist.name) {
        addPlaylist(playlist);
        setPlaylist({ name: '', description: '' });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Plus size={18} /> Create New Playlist
        </h3>
        <input
          type="text"
          value={playlist.name}
          onChange={(e) => setPlaylist({ ...playlist, name: e.target.value })}
          placeholder="Playlist name"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={playlist.description}
          onChange={(e) => setPlaylist({ ...playlist, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          type="submit"
          className="w-full py-3 bg-purple-500 rounded-lg text-white font-semibold hover:bg-purple-600 transition"
        >
          Create Playlist
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mystation-navy via-mystation-navyDark to-mystation-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{category?.icon || '🎵'}</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{currentStation?.displayName || 'Your Station'}</h1>
              <p className="text-white/50">@{currentStation?.username || 'username'}</p>
            </div>
          </div>
          <Link
            href={`/station/${currentStation?.username}`}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
          >
            <Eye size={18} /> View Station
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    activeSection === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat) => (
                    <div key={stat.name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <stat.icon className={stat.color} size={24} />
                        <span className="text-white/50 text-sm">{stat.name}</span>
                      </div>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveSection('products')}
                    className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-left"
                  >
                    <ShoppingBag className="text-blue-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold text-white">Add Product</h3>
                    <p className="text-white/50 text-sm">Sell digital or physical products</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('playlists')}
                    className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-left"
                  >
                    <ListMusic className="text-purple-400 mb-3" size={32} />
                    <h3 className="text-lg font-semibold text-white">Create Playlist</h3>
                    <p className="text-white/50 text-sm">Curate music from any source</p>
                  </button>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="text-center py-8">
                    <TrendingUp size={48} className="mx-auto text-white/20 mb-3" />
                    <p className="text-white/50">Activity will appear here as fans interact with your station</p>
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {activeSection === 'products' && (
              <div className="space-y-6">
                <ProductForm />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Your Products ({currentStation?.products?.length || 0})</h3>
                  {currentStation?.products?.length > 0 ? (
                    currentStation.products.map((product) => (
                      <div key={product.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">{product.name}</h4>
                          <p className="text-white/50 text-sm">{product.type} - ${product.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-white/50 hover:text-white transition">
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => removeProduct(product.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                      <Package size={48} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/50">No products yet. Add your first product above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Playlists */}
            {activeSection === 'playlists' && (
              <div className="space-y-6">
                <PlaylistForm />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Your Playlists ({currentStation?.playlists?.length || 0})</h3>
                  {currentStation?.playlists?.length > 0 ? (
                    currentStation.playlists.map((playlist) => (
                      <div key={playlist.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-lg flex items-center justify-center">
                            <Music size={24} className="text-purple-400" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{playlist.name}</h4>
                            <p className="text-white/50 text-sm">{playlist.tracks?.length || 0} tracks</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-white/50 hover:text-white transition">
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => removePlaylist(playlist.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                      <ListMusic size={48} className="mx-auto text-white/20 mb-3" />
                      <p className="text-white/50">No playlists yet. Create your first playlist above.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Earnings */}
            {activeSection === 'earnings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-white/50 text-sm mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-400">$0.00</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-white/50 text-sm mb-1">This Month</p>
                    <p className="text-3xl font-bold text-white">$0.00</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-white/50 text-sm mb-1">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">$0.00</p>
                  </div>
                </div>

                {/* Tips Toggle */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Enable Tips</h3>
                      <p className="text-white/50 text-sm">Let fans support you with tips</p>
                    </div>
                    <button
                      onClick={() => setTipsEnabled(!currentStation?.tips?.enabled)}
                      className={`w-14 h-8 rounded-full transition relative ${
                        currentStation?.tips?.enabled ? 'bg-green-500' : 'bg-white/20'
                      }`}
                    >
                      <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition ${
                        currentStation?.tips?.enabled ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <DollarSign size={48} className="mx-auto text-white/20 mb-3" />
                  <p className="text-white/50">Earnings history will appear here as you make sales</p>
                </div>
              </div>
            )}

            {/* Settings */}
            {activeSection === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Station Settings</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Display Name</label>
                      <input
                        type="text"
                        defaultValue={currentStation?.displayName}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-2">Bio</label>
                      <textarea
                        defaultValue={currentStation?.bio}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                    <button className="px-6 py-3 bg-blue-500 rounded-lg text-white font-semibold hover:bg-blue-600 transition">
                      Save Changes
                    </button>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-white/50 text-sm mb-4">Once you delete your station, there is no going back.</p>
                  <button className="px-6 py-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 font-semibold hover:bg-red-500/30 transition">
                    Delete Station
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
