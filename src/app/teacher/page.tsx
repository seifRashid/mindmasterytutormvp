import Link from "next/link";
import { Sparkles, Video, HelpCircle, Users, Plus, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { getSession } from "@/lib/auth";
import { INITIAL_LESSONS, INITIAL_QUIZZES, INITIAL_TOPICS } from "@/lib/mock-data";

export default async function TeacherDashboardPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Teacher Workspace
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Welcome, {session?.name || "Prof. Alex Rivera"}! 🎓
              </h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
                Upload video lessons, manage topic quizzes, and evaluate student accuracy metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <CrudModal
                type="lesson"
                topics={INITIAL_TOPICS.map((t) => ({ id: t.id, title: t.title }))}
              />
              <CrudModal
                type="quiz"
                topics={INITIAL_TOPICS.map((t) => ({ id: t.id, title: t.title }))}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {INITIAL_LESSONS.length} Video Lessons
              </p>
              <p className="text-xs text-slate-500 font-medium">Published Video Instructions</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {INITIAL_QUIZZES.length} Active Quizzes
              </p>
              <p className="text-xs text-slate-500 font-medium">Topic Assessments Created</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">128 Students</p>
              <p className="text-xs text-slate-500 font-medium">Active Enrolled Learners</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
