"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Play, Pause } from "lucide-react";
import { Lesson } from "@/lib/types";

interface VideoPlayerProps {
  lesson: Lesson;
  initialDuration?: number;
  completed: boolean;
  isSaving: boolean;
  updateProgress: (watchedDuration: number, completed: boolean) => Promise<void>;
}

export function VideoPlayer({
  lesson,
  initialDuration = 0,
  completed,
  isSaving,
  updateProgress,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedDuration, setWatchedDuration] = useState(initialDuration);

  // Simulated playback duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchedDuration((prev) => {
          const nextVal = prev + 1;
          // Auto-save every 10 seconds
          if (nextVal % 10 === 0) {
            updateProgress(nextVal, completed);
          }
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, completed, updateProgress]);

  const handleToggleComplete = () => {
    const newStatus = !completed;
    updateProgress(watchedDuration, newStatus);
  };

  const progressPercent = Math.min(
    100,
    Math.round((watchedDuration / (lesson.duration || 600)) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Video Frame */}
      <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-video">
        <iframe
          src={`${lesson.videoUrl}?autoplay=${isPlaying ? 1 : 0}`}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{ touchAction: "manipulation" }}
          className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-transform cursor-pointer select-none"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Play Video
            </>
          )}
        </button>

        {/* Watch duration */}
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
          {Math.floor(watchedDuration / 60)}m watched &nbsp;·&nbsp; {progressPercent}% complete
        </span>

        {/* Mark as Complete */}
        <button
          onClick={handleToggleComplete}
          disabled={isSaving}
          style={{ touchAction: "manipulation" }}
          className={`ml-auto flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer select-none ${
            completed
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {completed ? "Completed ✓" : "Mark Complete"}
        </button>
      </div>
    </div>
  );
}
