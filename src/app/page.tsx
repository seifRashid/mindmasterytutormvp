import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  Video,
  Award,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  Users,
  CheckCircle2,
  Play,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40">
        {/* Glowing Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-cyan-400/30 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-cyan-400 shadow-xl">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured E-Learning Platform for STEM & Core Subjects</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Master Everyy Subject Step-by-Step with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
              Guided Mastery
            </span>
          </h1>
<p>I am testing deployment from development to main</p>
          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Mind Mastery Tutor gives students a clear learning path through HD video lessons,
            interactive topic progression, and automated quizzes with step-by-step retry explanations.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register/student"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <GraduationCap className="w-4 h-4" />
              Start Learning Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register/teacher"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold text-sm border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Join as Teacher
            </Link>
          </div>

          {/* Interactive Preview Card */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="p-4 sm:p-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    topic-preview / math-algebra / linear-equations
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  Grade 8 • Lesson 01
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-10">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="absolute bottom-3 left-3 text-xs text-white font-medium z-10">
                    Introduction to Linear Equations (10m 40s)
                  </span>
                </div>

                <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Topic Progression
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60 text-xs font-medium text-cyan-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      01. Linear Equations (Active)
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 text-xs text-slate-400 flex items-center gap-2 opacity-70">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      02. Graphing Inequalities
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 text-xs text-slate-400 flex items-center gap-2 opacity-70">
                      <Award className="w-4 h-4 shrink-0" />
                      03. Topic Assessment Quiz
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-white">Built for Effortless Learning</h2>
            <p className="text-sm text-slate-400">
              Everything students and teachers need for structured subject mastery in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Curated Video Lessons</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Step-by-step video instructions with automatic watched duration tracking and instant resume support.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Interactive Quiz System</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multiple-choice questions with automatic grading, score tracking, and detailed step-by-step explanations after 3 failed attempts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Student Progress Dashboard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visual progress tracking for classes, subject percentage completion rates, and learning streak indicators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Mind Mastery Tutor Learning Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-slate-300">About</Link>
            <Link href="/pricing" className="hover:text-slate-300">Pricing</Link>
            <Link href="/contact" className="hover:text-slate-300">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
