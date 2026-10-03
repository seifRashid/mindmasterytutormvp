"use client";

import { useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, X } from "lucide-react";
import {
  softDeleteQuizAction,
  restoreQuizAction,
  permanentlyDeleteQuizAction,
} from "@/actions/teacher-actions";

interface QuizActionButtonsProps {
  quizId: string;
  quizTitle: string;
  mode: "active" | "recycle";
  isAdmin?: boolean;
}

export function QuizActionButtons({
  quizId,
  quizTitle,
  mode,
  isAdmin = false,
}: QuizActionButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSoftDelete = async () => {
    setIsPending(true);
    setErrorMsg(null);
    const res = await softDeleteQuizAction(quizId);
    setIsPending(false);
    if (res && (res as any).error) {
      setErrorMsg((res as any).error);
    } else {
      setShowModal(false);
    }
  };

  const handleRestore = async () => {
    setIsPending(true);
    setErrorMsg(null);
    const res = await restoreQuizAction(quizId);
    setIsPending(false);
    if (res && (res as any).error) {
      alert((res as any).error);
    }
  };

  const handlePermanentDelete = async () => {
    setIsPending(true);
    setErrorMsg(null);
    const res = await permanentlyDeleteQuizAction(quizId);
    setIsPending(false);
    if (res && (res as any).error) {
      setErrorMsg((res as any).error);
    } else {
      setShowModal(false);
    }
  };

  if (mode === "active") {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          style={{ touchAction: "manipulation" }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer select-none text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>

        {/* Soft Delete Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500 mb-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Quiz?</h3>
                  <p className="text-xs text-rose-500 font-semibold">Will be moved to Recycle Bin</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}
                <p>
                  Are you sure you want to delete <strong className="text-slate-900 dark:text-white font-bold">&ldquo;{quizTitle}&rdquo;</strong>?
                </p>
                <p className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  ℹ️ Soft-deleted quizzes are kept in the recycle bin for <strong>1 month (30 days)</strong>. You can restore them anytime before they are permanently deleted by default.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSoftDelete}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-sm font-bold transition-all select-none cursor-pointer"
                >
                  {isPending ? "Moving..." : "Move to Recycle Bin"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Recycle Mode Buttons
  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleRestore}
          disabled={isPending}
          style={{ touchAction: "manipulation" }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors cursor-pointer select-none text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {isPending ? "Restoring..." : "Restore"}
        </button>
        <button
          onClick={() => setShowModal(true)}
          style={{ touchAction: "manipulation" }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer select-none text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Permanently
        </button>
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-500 mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Permanently?</h3>
                <p className="text-xs text-rose-500 font-semibold">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
              <p>
                Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white font-bold">&ldquo;{quizTitle}&rdquo;</strong>?
              </p>
              <p className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs font-semibold">
                ⚠️ All questions, options, student attempt records, and AI evaluation results associated with this quiz will be permanently purged from the platform database.
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-sm font-bold transition-all select-none cursor-pointer"
              >
                {isPending ? "Purging..." : "Yes, Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
