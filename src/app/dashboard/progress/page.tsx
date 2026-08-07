import {
  TrendingUp,
  CheckCircle2,
  Award,
  Video,
  Flame,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { INITIAL_SUBJECTS } from "@/lib/mock-data";

export default async function StudentProgressPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Analytics & Achievements
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Your Learning Progress
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Track your subject completion percentages, quiz scores, and streak milestones.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                <Video className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">12 Lessons</p>
              <p className="text-xs text-slate-500 font-medium">Completed Video Lessons</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">94% Avg</p>
              <p className="text-xs text-slate-500 font-medium">Quiz Accuracy Score</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">4 Days</p>
              <p className="text-xs text-slate-500 font-medium">Current Learning Streak</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">3 Badges</p>
              <p className="text-xs text-slate-500 font-medium">Mastery Certificates</p>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Subject Completion Percentages
            </h2>

            <div className="space-y-4">
              {INITIAL_SUBJECTS.map((sub, idx) => {
                const percent = [75, 40, 90][idx % 3];
                return (
                  <div key={sub.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white">{sub.title}</span>
                      <span className="text-blue-600 dark:text-blue-400">{percent}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
