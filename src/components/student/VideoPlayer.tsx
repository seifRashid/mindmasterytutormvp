"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Play, Pause, Award, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateLessonProgressAction } from "@/actions/student-actions";
import { Lesson } from "@/lib/types";

interface VideoPlayerProps {
  lesson: Lesson;
  prevLessonId?: string;
  nextLessonId?: string;
  nextQuizId?: string;
  initialCompleted?: boolean;
  initialDuration?: number;
}

export function VideoPlayer({
  lesson,
  prevLessonId,
  nextLessonId,
  nextQuizId,
  initialCompleted = false,
  initialDuration = 0,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const [watchedDuration, setWatchedDuration] = useState(initialDuration);
  const [isSaving, setIsSaving] = useState(false);

  // Simulated playback duration ticker
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchedDuration((prev) => {
          const nextVal = prev + 1;
          // Auto-save every 10 seconds
          if (nextVal % 10 === 0) {
            updateLessonProgressAction(lesson.id, nextVal, completed);
          }
          return nextVal;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, lesson.id, completed]);

  const handleToggleComplete = async () => {
    setIsSaving(true);
    const newStatus = !completed;
    setCompleted(newStatus);
    await updateLessonProgressAction(lesson.id, watchedDuration, newStatus);
    setIsSaving(false);
  };

  const progressPercent = Math.min(
    100,
    Math.round((watchedDuration / (lesson.duration || 600)) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Video Frame — no overlays on top of it so mobile touch works */}
      <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-video">
        <iframe
          src={`${lesson.videoUrl}?autoplay=${isPlaying ? 1 : 0}`}
          title={lesson.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Progress Bar — below the video, never overlaid */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controls — fully outside the iframe, always tappable on mobile */}
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

      {/* Lesson Details & Navigation */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1 max-w-xl">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            {lesson.title}
            {completed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-semibold border border-emerald-300 dark:border-emerald-800">
                Done
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {lesson.description}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {prevLessonId && (
            <Link
              href={`/dashboard/lessons/${prevLessonId}`}
              style={{ touchAction: "manipulation" }}
              className="px-4 py-3 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors active:scale-95"
            >
              ← Previous
            </Link>
          )}

          {nextLessonId ? (
            <Link
              href={`/dashboard/lessons/${nextLessonId}`}
              style={{ touchAction: "manipulation" }}
              className="px-4 py-3 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all ml-auto md:ml-0 active:scale-95"
            >
              Next Lesson →
            </Link>
          ) : nextQuizId ? (
            <Link
              href={`/dashboard/quizzes/${nextQuizId}`}
              style={{ touchAction: "manipulation" }}
              className="px-4 py-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-95 shadow-md flex items-center gap-1.5 transition-all ml-auto md:ml-0 active:scale-95"
            >
              <Award className="w-4 h-4" />
              Take Quiz
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
