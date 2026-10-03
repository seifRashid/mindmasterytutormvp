import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
  lessons as dbLessons,
} from "@/db/schema";
import {
  INITIAL_QUIZZES,
  INITIAL_QUESTIONS,
  INITIAL_TOPICS,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
} from "@/lib/mock-data";
import { purgeExpiredRecycleBinQuizzes } from "@/actions/teacher-actions";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { QuizzesListManager } from "@/components/admin/QuizzesListManager";

export default async function TeacherQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  const { view } = await searchParams;
  const isRecycleBin = view === "recycle";

  // 1. Run automatic cleanup of expired recycle bin quizzes (deleted > 30 days ago)
  await purgeExpiredRecycleBinQuizzes();

  // 2. Fetch live records with fallback
  let quizzesList: any[] = [];
  let topicsList: any[] = [];
  let subjectsList: any[] = [];
  let classesList: any[] = [];
  let lessonsList: any[] = [];
  let questionsList: any[] = [];

  try {
    quizzesList = await db.select().from(dbQuizzes);
    topicsList = await db.select().from(dbTopics);
    subjectsList = await db.select().from(dbSubjects);
    classesList = await db.select().from(dbClasses);
    lessonsList = await db.select().from(dbLessons);
    questionsList = await db.select().from(dbQuestions);
  } catch (err) {
    console.warn("Database fetch failed in TeacherQuizzesPage, falling back to mock data:", err);
  }

  if (quizzesList.length === 0) {
    quizzesList = INITIAL_QUIZZES;
  }
  if (topicsList.length === 0) {
    topicsList = INITIAL_TOPICS;
  }
  if (subjectsList.length === 0) {
    subjectsList = INITIAL_SUBJECTS;
  }
  if (classesList.length === 0) {
    classesList = INITIAL_CLASSES;
  }
  if (questionsList.length === 0) {
    questionsList = INITIAL_QUESTIONS;
  }

  // Partition into active and recycle bin
  const activeQuizzes = quizzesList.filter((q) => !q.deletedAt);
  const recycleQuizzes = quizzesList.filter((q) => !!q.deletedAt);
  const displayedQuizzes = isRecycleBin ? recycleQuizzes : activeQuizzes;

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
                My Quizzes
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage your assessments, question banks, AI gradings, and recycled tests.
              </p>
            </div>

            {view !== "recycle" && (
              <Link
                href="/teacher/quizzes/new"
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center select-none"
              >
                <Plus className="w-4 h-4" />
                Create New Quiz
              </Link>
            )}
          </div>

          {/* View Toggles */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm">
            <Link
              href="/teacher/quizzes"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                !isRecycleBin
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Active Quizzes ({activeQuizzes.length})
            </Link>
            <Link
              href="/teacher/quizzes?view=recycle"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                isRecycleBin
                  ? "border-rose-600 text-rose-600 dark:text-rose-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Recycle Bin ({recycleQuizzes.length})
            </Link>
          </div>

          {/* Quizzes List Manager with Filters & Table */}
          <QuizzesListManager
            quizzes={displayedQuizzes}
            questions={questionsList}
            topics={topicsList}
            subjects={subjectsList}
            classes={classesList}
            lessons={lessonsList}
            isRecycleBin={isRecycleBin}
            isAdmin={false}
            currentUserId={session?.id}
          />
        </main>
      </div>
    </div>
  );
}
