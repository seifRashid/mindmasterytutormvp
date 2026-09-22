import Link from "next/link";
import {
  GraduationCap,
  Sparkles,
  Video,
  Award,
  TrendingUp,
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
    <div className="min-h-screen bg-[#24130d] text-orange-50 selection:bg-orange-500 selection:text-white">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 md:pt-32 md:pb-40">
        {/* Glowing Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-orange-600/35 via-amber-500/20 to-yellow-300/25 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#351b10] border border-orange-800/70 text-xs font-semibold text-amber-300 shadow-xl">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured E-Learning Platform for STEM & Core Subjects</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-orange-50 max-w-4xl mx-auto leading-[1.1]">
            Master Every Subject Step-by-Step with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-200">
              Guided Mastery
            </span>
          </h1>
          <p className="text-base sm:text-xl text-orange-100/70 max-w-2xl mx-auto font-normal leading-relaxed">
            Mind Mastery Tutor gives students a clear learning path through lessons,
            interactive topic progression, and automated quizzes with step-by-step retry explanations.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register/student"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm shadow-xl shadow-orange-900/40 transition-all flex items-center justify-center gap-2 group"
            >
              <GraduationCap className="w-4 h-4" />
              Start Learning Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register/teacher"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#351b10] hover:bg-[#482313] text-orange-100 font-semibold text-sm border border-orange-800/70 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-300" />
              Join as Teacher
            </Link>
          </div>

          {/* Interactive Preview Card */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="p-4 sm:p-6 bg-[#30170e]/90 rounded-2xl border border-orange-900/80 shadow-2xl backdrop-blur-xl text-left space-y-4">
              <div className="flex items-center justify-between border-b border-orange-900/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-orange-200/60 font-mono ml-2">
                    topic-preview / math-algebra / linear-equations
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-orange-950 text-amber-300 border border-orange-800">
                  Grade 8 • Lesson 01
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative aspect-video rounded-xl bg-[#1b0d09] border border-orange-900/80 overflow-hidden flex items-center justify-center group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b0d09]/90 to-transparent" />
                  <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-950/60 group-hover:scale-110 transition-transform z-10">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="absolute bottom-3 left-3 text-xs text-white font-medium z-10">
                    Introduction to Linear Equations (10m 40s)
                  </span>
                </div>

                <div className="space-y-3 p-3 bg-[#1b0d09]/70 rounded-xl border border-orange-900/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-200/60">
                    Topic Progression
                  </h4>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-orange-950/70 border border-orange-700/70 text-xs font-medium text-amber-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-300 shrink-0" />
                      01. Linear Equations (Active)
                    </div>
                    <div className="p-2 rounded-lg bg-[#30170e] text-xs text-orange-100/55 flex items-center gap-2 opacity-70">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      02. Graphing Inequalities
                    </div>
                    <div className="p-2 rounded-lg bg-[#30170e] text-xs text-orange-100/55 flex items-center gap-2 opacity-70">
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
      <section className="py-20 bg-[#1d100b]/70 border-y border-orange-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-bold text-orange-50">Built for Effortless Learning</h2>
            <p className="text-sm text-orange-100/60">
              Everything students and teachers need for structured subject mastery in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#30170e] border border-orange-900/80 space-y-4 hover:border-orange-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-800 text-orange-300 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-orange-50">Curated Lessons</h3>
              <p className="text-xs text-orange-100/60 leading-relaxed">
                Step-by-step instructions with automatic watched duration tracking and instant resume support.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#30170e] border border-orange-900/80 space-y-4 hover:border-orange-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-300 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-orange-50">Interactive Quiz System</h3>
              <p className="text-xs text-orange-100/60 leading-relaxed">
                Multiple-choice questions with automatic grading, score tracking, and detailed step-by-step explanations after 3 failed attempts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#30170e] border border-orange-900/80 space-y-4 hover:border-orange-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-800 text-amber-300 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-orange-50">Student Progress Dashboard</h3>
              <p className="text-xs text-orange-100/60 leading-relaxed">
                Visual progress tracking for classes, subject percentage completion rates, and learning streak indicators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-orange-950 text-center text-xs text-orange-100/45">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Mind Mastery Tutor Learning Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-orange-200">About</Link>
            <Link href="/pricing" className="hover:text-orange-200">Pricing</Link>
            <Link href="/contact" className="hover:text-orange-200">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
