import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  lessons as dbLessons,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
} from "@/db/schema";
import { eq, isNull, isNotNull, and } from "drizzle-orm";
import { toUuid, fromUuid } from "@/lib/id-mapper";
import { purgeExpiredRecycleBin } from "@/actions/teacher-actions";
import { Video, FileText, Paperclip, HelpCircle, Plus, Trash2, Library } from "lucide-react";
import Link from "next/link";
import { LessonsListManager } from "@/components/admin/LessonsListManager";

export default async function TeacherLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  const { view } = await searchParams;
  const isRecycleBin = view === "recycle";

  // 1. Run automatic cleanup of expired recycle bin lessons
  await purgeExpiredRecycleBin();

  // 2. Fetch data from DB
  const allLessons = await db.select().from(dbLessons);
  const activeLessons = allLessons.filter((l) => !l.deletedAt);
  const recycleLessons = allLessons.filter((l) => !!l.deletedAt);

  const displayedLessons = isRecycleBin ? recycleLessons : activeLessons;

  const topicsList = await db.select().from(dbTopics);
  const subjectsList = await db.select().from(dbSubjects);
  const classesList = await db.select().from(dbClasses);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Teacher Management
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                My Lessons & Learning Units
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Create and edit lesson notes, videos, materials, and quizzes for your students.
              </p>
            </div>
            {!isRecycleBin && (
              <Link
                href="/teacher/lessons/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-center cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                New Lesson
              </Link>
            )}
          </div>

          {/* View Toggles */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm">
            <Link
              href="/teacher/lessons"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                !isRecycleBin
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Library className="w-4 h-4" />
              Active Lessons ({activeLessons.length})
            </Link>
            <Link
              href="/teacher/lessons?view=recycle"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                isRecycleBin
                  ? "border-rose-600 text-rose-600 dark:text-rose-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Recycle Bin ({recycleLessons.length})
            </Link>
          </div>

          {/* Lessons List Manager */}
          <LessonsListManager
            lessons={displayedLessons}
            topics={topicsList}
            subjects={subjectsList}
            classes={classesList}
            isRecycleBin={isRecycleBin}
          />
        </main>
      </div>
    </div>
  );
}
