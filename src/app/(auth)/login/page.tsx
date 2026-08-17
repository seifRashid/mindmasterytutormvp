import Link from "next/link";
import { GraduationCap, ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { loginAction } from "@/actions/auth-actions";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

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



          <LoginForm loginAction={loginAction} />


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
