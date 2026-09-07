"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RotateCcw, Home, Sparkles, BookOpen } from "lucide-react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setChecking(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <WifiOff className="w-10 h-10" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Offline Mode
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
            No Internet Connection
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            It looks like you are currently offline. Mind Mastery Tutor has saved your shell and cached data so you won't lose your place.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRetry}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-95"
          >
            <RotateCcw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking connection..." : "Retry Connection"}
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>

        {/* Reassurance note */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Cached offline with PWA technology</span>
        </div>
      </div>
    </div>
  );
}
