"use client";

import { useActionState } from "react";
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  FileText,
  ShieldAlert,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface StudentRegisterFormProps {
  classes: Array<{ id: string; name: string }>;
  registerAction: (prevState: any, formData: FormData) => Promise<{ error?: string } | void>;
}

export function StudentRegisterForm({ classes, registerAction }: StudentRegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <form action={formAction} className="space-y-8">
      {state?.error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* ── SECTION 1: Student Information ────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            1. Student Identification
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="name"
                type="text"
                required
                disabled={isPending}
                placeholder="e.g. David Kim"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="email"
                type="email"
                required
                disabled={isPending}
                placeholder="david.kim@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Student Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="phone"
                type="tel"
                required
                disabled={isPending}
                placeholder="+1 (555) 234-5678"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Age *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  name="age"
                  type="number"
                  min="5"
                  max="25"
                  required
                  disabled={isPending}
                  placeholder="14"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gender *
              </label>
              <select
                name="gender"
                required
                disabled={isPending}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Class / Grade Selection */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Assigned Grade / Class *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <select
                name="classId"
                required
                disabled={isPending}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              >
                <option value="">-- Choose your grade --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Parent / Guardian Information ───────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            2. Parent / Guardian Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parent Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parent / Guardian Full Name *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="parentName"
                type="text"
                required
                disabled={isPending}
                placeholder="Robert Kim"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Parent Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parent / Guardian Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="parentPhone"
                type="tel"
                required
                disabled={isPending}
                placeholder="+1 (555) 987-6543"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Parent Email (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Parent / Guardian Email Address</span>
              <span className="text-[10px] text-slate-500 font-normal">Optional</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="parentEmail"
                type="email"
                disabled={isPending}
                placeholder="parent.kim@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Security & Notes ───────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            3. Account Security & Institution Notes
          </h2>
        </div>

        <div className="space-y-4">
          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                name="password"
                type="password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Additional Information / Notes for Institution</span>
              <span className="text-[10px] text-slate-500 font-normal">Optional</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <textarea
                name="notes"
                rows={2}
                disabled={isPending}
                placeholder="Mention any special learning requirements or background..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Approval Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/90 leading-relaxed">
          <strong>Pending Approval Policy:</strong> Once registered, your account will remain in a pending approval state. Teachers and administrators will review your application before full platform access is granted.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting Application...
          </>
        ) : (
          <>
            Submit Registration for Review
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
