"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="w-36 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />;
  }

  const isDark = resolvedTheme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      onClick={toggle}
      style={{ touchAction: "manipulation" }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative flex items-center rounded-full
        transition-all duration-500 ease-in-out
        cursor-pointer select-none overflow-hidden
        shadow-md active:scale-95
        ${isDark
          ? "bg-slate-900 border border-slate-700 w-32 h-8 flex-row-reverse"
          : "bg-slate-100 border border-slate-300 w-32 h-8 flex-row"
        }
      `}
    >
      {/* Sliding icon circle */}
      <span
        className={`
          flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
          shadow transition-all duration-500
          ${isDark
            ? "bg-white text-slate-900 ml-0.5"
            : "bg-white text-slate-900 mr-0.5"
          }
        `}
      >
        {isDark
          ? <Moon className="w-3.5 h-3.5 fill-slate-900" />
          : <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
        }
      </span>

      {/* Label */}
      <span
        className={`
          flex-1 text-center text-[10px] font-black tracking-wider uppercase
          transition-colors duration-300
          ${isDark ? "text-white" : "text-slate-700"}
        `}
      >
        {isDark ? "Night" : "Day"} Mode
      </span>
    </button>
  );
}
