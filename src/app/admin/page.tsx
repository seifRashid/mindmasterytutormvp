import Link from "next/link";
import {
  Layers,
  BookOpen,
  FolderTree,
  Video,
  HelpCircle,
  Users,
  Plus,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { CrudModal } from "@/components/admin/CrudModal";
import { getSession } from "@/lib/auth";
import {
  INITIAL_CLASSES,
  INITIAL_LESSONS,
  INITIAL_QUIZZES,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
} from "@/lib/mock-data";
import { getUsers } from "@/lib/user-store";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const dbUsers = await getUsers();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Top Admin Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Platform Control Panel
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Admin Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Manage curriculum hierarchy, video content, quiz assessments, and student performance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CrudModal type="class" />
              <CrudModal
                type="subject"
                classes={INITIAL_CLASSES.map((c) => ({ id: c.id, name: c.name }))}
              />
              <CrudModal
                type="lesson"
                topics={INITIAL_TOPICS.map((t) => ({ id: t.id, title: t.title }))}
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link
              href="/admin/classes"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{INITIAL_CLASSES.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Class Levels</p>
            </Link>

            <Link
              href="/admin/subjects"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{INITIAL_SUBJECTS.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Active Subjects</p>
            </Link>

            <Link
              href="/admin/topics"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <FolderTree className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{INITIAL_TOPICS.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Topics</p>
            </Link>

            <Link
              href="/admin/lessons"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{INITIAL_LESSONS.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Video Lessons</p>
            </Link>

            <Link
              href="/admin/quizzes"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{INITIAL_QUIZZES.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">Quizzes</p>
            </Link>

            <Link
              href="/admin/users"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{dbUsers.length}</p>
              <p className="text-[11px] text-slate-500 font-medium">User Accounts</p>
            </Link>
          </div>

          {/* Interactive Recharts Analytics Component */}
          <AnalyticsCharts />
        </main>
      </div>
    </div>
  );
}
