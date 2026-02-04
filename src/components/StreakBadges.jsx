/**
 * MYSTATION - Streak Badges Component
 */

"use client";

import { useState, useEffect } from "react";
import { Award, Flame, Star, Zap, Crown, Trophy } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";

const BADGES = [
  { id: "first-play", name: "First Play", icon: Zap, color: "blue" },
  { id: "week-streak", name: "7 Day Streak", icon: Flame, color: "orange" },
  { id: "month-streak", name: "30 Day Streak", icon: Star, color: "purple" },
  { id: "dedicated", name: "Dedicated Fan", icon: Trophy, color: "pink" },
  { id: "vault-member", name: "Vault Member", icon: Crown, color: "yellow" },
  { id: "century", name: "Century Club", icon: Award, color: "green" },
];

const colorMap = {
  blue: "from-blue-500 to-blue-600",
  orange: "from-orange-500 to-red-500",
  purple: "from-purple-500 to-indigo-600",
  pink: "from-pink-500 to-rose-600",
  yellow: "from-yellow-500 to-amber-600",
  green: "from-green-500 to-emerald-600",
};

export default function StreakBadges() {
  const [mounted, setMounted] = useState(false);
  const { currentStreak } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isEarned = (id) => {
    if (id === "first-play") return true;
    if (id === "week-streak") return currentStreak >= 7;
    if (id === "month-streak") return currentStreak >= 30;
    if (id === "dedicated") return currentStreak >= 60;
    if (id === "vault-member") return currentStreak >= 90;
    if (id === "century") return currentStreak >= 100;
    return false;
  };

  const earnedCount = BADGES.filter(b => isEarned(b.id)).length;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Award size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Your Badges</h3>
          <p className="text-white/50 text-sm">{earnedCount} of {BADGES.length} earned</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          const earned = isEarned(badge.id);
          const gradientClass = colorMap[badge.color];

          return (
            <div
              key={badge.id}
              className={earned
                ? "p-3 rounded-xl text-center bg-white/10 border border-white/20"
                : "p-3 rounded-xl text-center bg-white/[0.02] border border-white/5 opacity-40"
              }
            >
              <div className={earned
                ? "w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 bg-gradient-to-br " + gradientClass
                : "w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 bg-white/10"
              }>
                <Icon size={18} className="text-white" />
              </div>
              <p className={earned ? "text-xs font-medium text-white" : "text-xs font-medium text-white/40"}>
                {badge.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
