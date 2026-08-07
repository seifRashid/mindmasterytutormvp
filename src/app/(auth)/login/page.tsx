import Link from "next/link";
import { GraduationCap, ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { loginAction } from "@/actions/auth-actions";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar user={session} />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Sign In to Your Account</h1>
            <p className="text-xs text-slate-400">
              Enter your credentials to access your Mind Mastery learning portal.
            </p>
          </div>

          {/* Quick Demo Credentials Info Box */}
          <div className="p-3.5 bg-blue-950/60 rounded-2xl border border-blue-800/60 text-xs space-y-1">
            <p className="font-bold text-blue-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Demo Test Credentials:
            </p>
            <div className="text-[11px] text-slate-300 space-y-0.5 font-mono">
              <p>• Student: <span className="text-cyan-300">student@mindmastery.edu</span> / student123</p>
              <p>• Teacher: <span className="text-cyan-300">teacher@mindmastery.edu</span> / teacher123</p>
              <p>• Admin: <span className="text-cyan-300">admin@mindmastery.edu</span> / admin123</p>
            </div>
          </div>

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="student@mindmastery.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2">
            <p>
              Don&apos;t have an account? Choose your sign-up role:
            </p>
            <div className="flex items-center justify-center gap-4 pt-1 font-semibold">
              <Link href="/register/student" className="text-cyan-400 hover:underline">
                Student Sign Up
              </Link>
              <span>•</span>
              <Link href="/register/teacher" className="text-blue-400 hover:underline">
                Teacher Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
