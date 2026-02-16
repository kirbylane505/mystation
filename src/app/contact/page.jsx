/**
 * Contact Page - Booking, Press, Features
 */

'use client';

import { useState } from 'react';
import {
  Mail, Phone, MapPin, Send, Music, Mic, Newspaper,
  Users, CheckCircle, Loader2, Instagram, Twitter
} from 'lucide-react';

const inquiryTypes = [
  { id: 'booking', label: 'Booking / Shows', icon: Mic },
  { id: 'press', label: 'Press / Interview', icon: Newspaper },
  { id: 'feature', label: 'Feature Request', icon: Music },
  { id: 'business', label: 'Business Inquiry', icon: Users },
  { id: 'other', label: 'Other', icon: Mail },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    type: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.type || !form.message) return;

    setStatus('loading');

    // Store in localStorage for now (will connect to Supabase/email service)
    try {
      const inquiries = JSON.parse(localStorage.getItem('mystation_inquiries') || '[]');
      inquiries.push({
        ...form,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('mystation_inquiries', JSON.stringify(inquiries));

      setStatus('success');
      setForm({ name: '', email: '', type: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-b from-mystation-navy via-mystation-black to-mystation-black" />
      <div className="bg-orb w-[500px] h-[500px] bg-blue-600 top-[-150px] right-[-100px] opacity-30" />
      <div className="bg-orb w-[400px] h-[400px] bg-purple-500 bottom-[20%] left-[-100px] opacity-20" />

      <div className="relative max-w-screen-xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-white mb-4">Get In Touch</h1>
          <p className="text-xl text-white/50 max-w-xl mx-auto">
            Booking inquiries, press requests, features, and business opportunities
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <a
                  href="mailto:mystationllc@gmail.com"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">General / Become a Streamer</p>
                    <p className="text-sm">mystationllc@gmail.com</p>
                  </div>
                </a>
                <a
                  href="mailto:contact@lotlfest.com"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Mail size={18} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Love on the Lawn Festival</p>
                    <p className="text-sm">contact@lotlfest.com</p>
                  </div>
                </a>
                <a
                  href="https://instagram.com/mikepagelivin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition"
                >
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                    <Instagram size={18} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Instagram</p>
                    <p className="text-sm">@mikepagelivin</p>
                  </div>
                </a>
                <a
                  href="https://twitter.com/mikepagelivin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition"
                >
                  <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center">
                    <Twitter size={18} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Twitter</p>
                    <p className="text-sm">@mikepagelivin</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Management */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Management</h3>
              <div className="space-y-2">
                <p className="text-white font-medium">IDMG - Impossible Dreamz Music Group</p>
                <p className="text-white/50 text-sm">For all official inquiries</p>
                <a
                  href="mailto:mystationllc@gmail.com"
                  className="inline-block mt-2 px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition"
                >
                  Contact Management
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Based In</h3>
              <div className="flex items-center gap-3 text-white/60">
                <MapPin size={18} />
                <span>Atlanta, GA / Chicago, IL</span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-8">
              {status === 'success' ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/50 mb-6">We'll get back to you as soon as possible.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Inquiry Type */}
                  <div>
                    <label className="text-white/60 text-sm mb-3 block">What's this about?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {inquiryTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = form.type === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setForm({ ...form, type: type.id })}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${
                              isSelected
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon size={16} />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Your Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-white/60 text-sm mb-2 block">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Message</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us about your inquiry..."
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition resize-none"
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={status === 'loading' || !form.name || !form.email || !form.type || !form.message}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>

                  {status === 'error' && (
                    <p className="text-red-400 text-sm text-center">
                      Something went wrong. Please try again or email directly.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
