import Link from "next/link";
import { GraduationCap, Award, BookOpen, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getSession } from "@/lib/auth";

export default async function AboutPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar user={session} />

      <main className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            About Our Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white">
            Empowering Every Student to Achieve Subject Mastery
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Mind Mastery Tutor Learning Portal was built to make structured, high-quality education intuitive and accessible for all students and educators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <GraduationCap className="w-8 h-8 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Progressive Topic Unlocks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our curriculum roadmaps break down complex subjects into bite-sized topics and video instructions, ensuring foundational concepts are learned first.
            </p>
          </div>

          <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
            <Award className="w-8 h-8 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Retry & Step-by-Step Explanations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quizzes are designed for learning, not just testing. If a student attempts a quiz 3 times, detailed step-by-step explanations are automatically revealed.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
