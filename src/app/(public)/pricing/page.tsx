import Link from "next/link";
import { CheckCircle2, GraduationCap, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";

export default async function PricingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar user={session} />

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Simple Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Accessible Learning for Everyone
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your learning journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Student Starter
              </span>
              <h3 className="text-2xl font-bold text-white">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></h3>
              <p className="text-xs text-slate-400">Perfect for individual self-paced learning.</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Unlimited Video Lessons</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Interactive Topic Quizzes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> 3-Fail Explanation Unlocks</li>
              </ul>
            </div>
            <Link href="/register/student" className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs text-center">
              Join as Student
            </Link>
          </div>

          <div className="p-8 bg-slate-900 rounded-3xl border border-indigo-800/80 bg-gradient-to-b from-indigo-950/30 to-slate-900 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
                School & Teacher Plan
              </span>
              <h3 className="text-2xl font-bold text-white">$19 <span className="text-xs font-normal text-slate-400">/ month</span></h3>
              <p className="text-xs text-slate-400">Ideal for educators, tutors, and classroom managers.</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Custom Video Lesson Uploads</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Custom Quiz & Question Builder</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Student Analytics & Score Tracking</li>
              </ul>
            </div>
            <Link href="/register/teacher" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center">
              Register as Teacher
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
