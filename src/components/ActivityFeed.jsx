/**
 * MYSTATION - Activity Feed Component
 */

"use client";

import { useState, useEffect } from "react";
import { Play, Heart, Award, TrendingUp, Music } from "lucide-react";

const mockActivity = [
  { id: 1, type: "play", user: "Fan847", track: "Favorite Person", time: "2m ago" },
  { id: 2, type: "streak", user: "PageNation", days: 45, time: "5m ago" },
  { id: 3, type: "badge", user: "IDMGLoyalist", badge: "30 Day Streak", time: "12m ago" },
  { id: 4, type: "play", user: "ATLStreamer", track: "Trap Get Ugly", time: "15m ago" },
  { id: 5, type: "play", user: "MusicLover", track: "Photo Shoot", time: "22m ago" },
  { id: 6, type: "streak", user: "VaultHunter", days: 90, time: "30m ago" },
  { id: 7, type: "play", user: "DreamzFan", track: "Power to the People", time: "45m ago" },
  { id: 8, type: "badge", user: "FoundationFan", badge: "Dedicated", time: "1h ago" },
];

export default function ActivityFeed({ limit = 10, showTrending = false }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activities = mockActivity.slice(0, limit);

  const getIcon = (type) => {
    switch (type) {
      case "play": return Play;
      case "streak": return TrendingUp;
      case "badge": return Award;
      default: return Music;
    }
  };

  const getMessage = (item) => {
    switch (item.type) {
      case "play": return "played " + item.track;
      case "streak": return "hit " + item.days + " day streak";
      case "badge": return "earned " + item.badge;
      default: return "";
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Activity Feed</h3>
          <p className="text-white/50 text-sm">Live fan activity</p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <Icon size={14} className="text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">
                  <span className="font-semibold">{item.user}</span>{" "}
                  <span className="text-white/60">{getMessage(item)}</span>
                </p>
              </div>
              <span className="text-white/30 text-xs">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
