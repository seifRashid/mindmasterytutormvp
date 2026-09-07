"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";

export function PwaSplashScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only show full splash on cold app load
    const hasSeenSplash = typeof window !== "undefined" ? sessionStorage.getItem("pwa_splash_seen") : null;
    
    // Quick timeout for cold boot
    const delay = hasSeenSplash ? 150 : 550;

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const removeTimer = setTimeout(() => {
        setShowSplash(false);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pwa_splash_seen", "true");
        }
      }, 400);

      return () => clearTimeout(removeTimer);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-400 ease-out select-none ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
      aria-hidden={isFadingOut}
    >
      {/* Background ambient light */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-5 px-6 text-center">
        {/* Animated Brand Emblem */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 ring-1 ring-white/20">
            <GraduationCap className="w-12 h-12 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-400 items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-950 fill-current" />
            </span>
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5 pt-2">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Mind Mastery
          </h1>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">
            E-Learning &amp; Mastery Portal
          </p>
        </div>

        {/* Sleek App Loading Bar */}
        <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
