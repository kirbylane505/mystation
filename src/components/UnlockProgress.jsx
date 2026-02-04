/**
 * MYSTATION - Unlock Progress Component
 */

"use client";

import { useState, useEffect } from "react";
import { Lock, Unlock, Music, Film, Crown } from "lucide-react";
import { useLoyaltyStore } from "@/store/loyaltyStore";

const UNLOCKS = [
  { id: "behind-scenes", name: "Behind the Scenes", days: 30, icon: Film },
  { id: "snippets", name: "Unreleased Snippets", days: 60, icon: Music },
  { id: "vault", name: "The Vault", days: 90, icon: Crown },
];

export default function UnlockProgress() {
  const [mounted, setMounted] = useState(false);
  const { currentStreak } = useLoyaltyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Unlock Progress</h3>
      <div className="space-y-4">
        {UNLOCKS.map((unlock) => {
          const Icon = unlock.icon;
          const isUnlocked = currentStreak >= unlock.days;
          const progress = Math.min(100, (currentStreak / unlock.days) * 100);

          return (
            <div key={unlock.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <Unlock size={16} className="text-green-400" />
                  ) : (
                    <Lock size={16} className="text-white/30" />
                  )}
                  <span className={isUnlocked ? "text-white" : "text-white/50"}>
                    {unlock.name}
                  </span>
                </div>
                <span className="text-white/40 text-sm">{unlock.days} days</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isUnlocked ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: progress + "%" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
