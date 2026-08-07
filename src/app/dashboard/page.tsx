import Link from "next/link";
import {
  BookOpen,
  Play,
  Award,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { INITIAL_LESSONS, INITIAL_SUBJECTS, INITIAL_TOPICS } from "@/lib/mock-data";

export default async function StudentDashboardPage() {
  const session = await getSession();
  const activeSubject = INITIAL_SUBJECTS[0];
  const activeLesson = INITIAL_LESSONS[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Welcome & Streak Banner */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                Student Learning Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Welcome back, {session?.name || "David"}! 👋
              </h1>
              <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
                You are on a <span className="font-bold underline text-white">4-day learning streak</span>. Keep building your mastery across Mathematics and Python!
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-lg">
                <Flame className="w-7 h-7 fill-current" />
              </div>
              <div>
                <p className="text-xl font-black">4 Days</p>
                <p className="text-[11px] text-blue-100 font-medium">Active Learning Streak</p>
              </div>
            </div>
          </div>

          {/* Continue Learning Widget */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                Resume Learning
              </h2>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Next Lesson Ready
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {activeSubject.title} • Grade 8
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {activeLesson.description}
                </p>
              </div>

              <Link
                href={`/dashboard/lessons/${activeLesson.id}`}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                Watch Lesson
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Active Subjects Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Enrolled Subjects
              </h2>
              <Link
                href="/dashboard/subjects"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Subjects →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {INITIAL_SUBJECTS.map((sub, idx) => {
                const subTopics = INITIAL_TOPICS.filter((t) => t.subjectId === sub.id);
                const progressVal = [75, 40, 90][idx % 3];

                return (
                  <Link
                    key={sub.id}
                    href={`/dashboard/subjects/${sub.slug}`}
                    className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {progressVal}% Done
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {sub.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {sub.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between pt-1">
                      <span>{subTopics.length} Topics</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Resume Roadmap <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
