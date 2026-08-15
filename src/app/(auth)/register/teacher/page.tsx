import Link from "next/link";
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck } from "lucide-react";
import { registerTeacherAction } from "@/actions/auth-actions";
import { Navbar } from "@/components/layout/Navbar";
import { TeacherRegisterForm } from "./TeacherRegisterForm";

export default function RegisterTeacherPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Teacher Registration</h1>
            <p className="text-xs text-slate-400">
              Create an instructor account to manage video lessons, build quizzes, and monitor student progress.
            </p>
          </div>

          <TeacherRegisterForm registerAction={registerTeacherAction} />

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
