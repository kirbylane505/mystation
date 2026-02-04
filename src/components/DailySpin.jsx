/**
 * MYSTATION - Daily Spin Component
 */

"use client";

import { useState, useEffect } from "react";
import { Gift, Sparkles } from "lucide-react";

export default function DailySpin() {
  const [mounted, setMounted] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already spun today
    const lastSpin = localStorage.getItem("lastSpinDate");
    const today = new Date().toDateString();
    if (lastSpin === today) {
      setHasSpun(true);
    }
  }, []);

  const handleSpin = () => {
    if (hasSpun || spinning) return;
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setHasSpun(true);
      localStorage.setItem("lastSpinDate", new Date().toDateString());
    }, 2000);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={handleSpin}
      disabled={hasSpun || spinning}
      className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
        hasSpun
          ? "bg-white/10 cursor-not-allowed"
          : "bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105 cursor-pointer shadow-lg shadow-purple-500/30"
      } ${spinning ? "animate-spin" : ""}`}
    >
      {hasSpun ? (
        <Sparkles size={32} className="text-white/40" />
      ) : (
        <Gift size={32} className="text-white" />
      )}
      {!hasSpun && !spinning && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
