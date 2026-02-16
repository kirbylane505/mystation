/**
 * MYSTATION - Alarm Clock
 * Wake up to your favorite Mike Page tracks!
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlarmClock, X, Play, Clock, Music, Volume2, Check, Trash2 } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { tracks } from '@/data/tracks';

export default function AlarmClockModal({ isOpen, onClose }) {
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [volume, setVolume] = useState(80);
  const [savedAlarms, setSavedAlarms] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [isRinging, setIsRinging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { setCurrentTrack, setQueue, play } = usePlayerStore();

  // Load saved alarms from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mystation-alarms');
    if (saved) {
      try { setSavedAlarms(JSON.parse(saved)); } catch { localStorage.removeItem('mystation-alarms'); }
    }
  }, []);

  // Check for alarm trigger
  useEffect(() => {
    const checkAlarm = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      savedAlarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTime && !isRinging) {
          triggerAlarm(alarm);
        }
      });
    }, 1000);

    return () => clearInterval(checkAlarm);
  }, [savedAlarms, isRinging]);

  const triggerAlarm = useCallback((alarm) => {
    setIsRinging(true);
    setActiveAlarm(alarm);

    // Find the track and play it
    const track = tracks.find(t => t.id === alarm.trackId);
    if (track) {
      setCurrentTrack(track);
      setQueue([track]);
      play();

      // Request notification permission and show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('MyStation Alarm', {
          body: `Wake up! Playing "${track.title}" by Mike Page`,
          icon: '/icons/icon-192x192.png',
          tag: 'mystation-alarm'
        });
      }
    }
  }, [setCurrentTrack, setQueue, play]);

  const stopAlarm = () => {
    setIsRinging(false);
    setActiveAlarm(null);
  };

  const saveAlarm = () => {
    if (!selectedTrack) return;

    const newAlarm = {
      id: Date.now(),
      time: alarmTime,
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      volume,
      enabled: true
    };

    const updated = [...savedAlarms, newAlarm];
    setSavedAlarms(updated);
    localStorage.setItem('mystation-alarms', JSON.stringify(updated));
    setSelectedTrack(null);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const deleteAlarm = (id) => {
    const updated = savedAlarms.filter(a => a.id !== id);
    setSavedAlarms(updated);
    localStorage.setItem('mystation-alarms', JSON.stringify(updated));
  };

  const toggleAlarm = (id) => {
    const updated = savedAlarms.map(a =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    setSavedAlarms(updated);
    localStorage.setItem('mystation-alarms', JSON.stringify(updated));
  };

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.featured && t.featured.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  // Ringing alarm overlay
  if (isRinging && activeAlarm) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-yellow-500/30 rounded-full animate-ping" />
            <AlarmClock size={120} className="text-yellow-400 mx-auto animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Wake Up!</h1>
          <p className="text-xl text-white/70 mb-8">{activeAlarm.trackTitle}</p>
          <button
            onClick={stopAlarm}
            className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-xl rounded-full hover:scale-105 transition-transform"
          >
            STOP ALARM
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <AlarmClock className="text-yellow-400" size={24} />
            <h2 className="text-xl font-bold text-white">Wake Up Alarm</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
            <X className="text-white/70" size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {/* Set New Alarm */}
          <div className="mb-6">
            <h3 className="text-white/70 text-sm mb-3 flex items-center gap-2">
              <Clock size={16} /> SET NEW ALARM
            </h3>

            {/* Time Picker */}
            <input
              type="time"
              value={alarmTime}
              onChange={(e) => setAlarmTime(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-3xl text-white text-center mb-4"
            />

            {/* Track Selection */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Music size={16} className="text-white/50" />
                <span className="text-white/70 text-sm">SELECT TRACK</span>
              </div>
              <input
                type="text"
                placeholder="Search tracks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 mb-2"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredTracks.slice(0, 10).map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedTrack?.id === track.id
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                      {selectedTrack?.id === track.id ? (
                        <Check size={16} className="text-black" />
                      ) : (
                        <Play size={14} className="text-black" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{track.title}</p>
                      {track.featured && (
                        <p className="text-white/50 text-xs">ft. {track.featured}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-white/50" />
                <span className="text-white/70 text-sm">WAKE UP VOLUME: {volume}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full accent-yellow-500"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={saveAlarm}
              disabled={!selectedTrack}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                selectedTrack
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <AlarmClock size={20} />
              SET ALARM
            </button>
          </div>

          {/* Saved Alarms */}
          {savedAlarms.length > 0 && (
            <div>
              <h3 className="text-white/70 text-sm mb-3">YOUR ALARMS</h3>
              <div className="space-y-2">
                {savedAlarms.map(alarm => (
                  <div
                    key={alarm.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      alarm.enabled ? 'bg-white/10' : 'bg-white/5 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleAlarm(alarm.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          alarm.enabled ? 'bg-yellow-500' : 'bg-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                          alarm.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <div>
                        <p className="text-white font-bold text-lg">{alarm.time}</p>
                        <p className="text-white/50 text-xs">{alarm.trackTitle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAlarm(alarm.id)}
                      className="p-2 hover:bg-white/10 rounded-full"
                    >
                      <Trash2 size={18} className="text-white/50" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
