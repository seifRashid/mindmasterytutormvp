"use client";

import { useState } from "react";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { deleteEntityAction } from "@/actions/admin-actions";

interface ClassData {
  id: string;
  name: string;
}

interface DeleteClassModalProps {
  classLevel: ClassData;
}

export function DeleteClassModal({ classLevel }: DeleteClassModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await deleteEntityAction("class", classLevel.id);

    setLoading(false);
    if (res && (res as any).error) {
      setError((res as any).error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1200);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(false);
        }}
        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center justify-center transition-colors"
        title="Delete Class Level"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative text-left space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                Delete Confirmation
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success States */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-medium">
                Class level and all associated data deleted successfully!
              </div>
            )}

            {!success && (
              <>
                {/* Warnings */}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider">Warning: Permanent Action</p>
                    <p className="text-xs leading-relaxed">
                      You are about to delete <strong className="text-slate-950 dark:text-white">&quot;{classLevel.name}&quot;</strong>. 
                      This will permanently remove all associated **subjects**, **topics**, **lessons**, and **quizzes** assigned to this class level from the database.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you absolutely sure you want to proceed? This action is irreversible.
                </p>

                {/* Actions */}
                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-rose-600/10"
                  >
                    {loading ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
