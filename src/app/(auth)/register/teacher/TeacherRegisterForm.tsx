"use client";

import { useActionState } from "react";
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface TeacherRegisterFormProps {
  registerAction: (prevState: any, formData: FormData) => Promise<{ error?: string } | void>;
}

export function TeacherRegisterForm({ registerAction }: TeacherRegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Full Name & Title
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            name="name"
            type="text"
            required
            disabled={isPending}
            placeholder="Prof. Alex Rivera"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Instructor Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            name="email"
            type="email"
            required
            disabled={isPending}
            placeholder="alex.rivera@mindmastery.edu"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            name="password"
            type="password"
            required
            disabled={isPending}
            placeholder="••••••••"
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating Instructor...
          </>
        ) : (
          <>
            Create Instructor Account
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
