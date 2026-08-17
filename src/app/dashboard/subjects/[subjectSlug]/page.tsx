import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Play,
  Award,
  ArrowRight,
  ChevronRight,
  Lock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { INITIAL_SUBJECTS } from "@/lib/mock-data";
import { db } from "@/db";
import {
  topics as dbTopics,
  lessons as dbLessons,
  quizzes as dbQuizzes,
} from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const session = await getSession();
  const { subjectSlug } = await params;

  const subject = INITIAL_SUBJECTS.find((s) => s.slug === subjectSlug);
  if (!subject) notFound();

  const subjectUuid = toUuid(subject.id);

  // Fetch topics for this subject
  const topics = await db
    .select()
    .from(dbTopics)
    .where(eq(dbTopics.subjectId, subjectUuid))
    .orderBy(dbTopics.orderNumber);

  const topicIds = topics.map((t) => t.id);

  // Fetch non-deleted lessons for these topics
  const lessonsList = topicIds.length > 0
    ? await db
        .select()
        .from(dbLessons)
        .where(
          and(
            inArray(dbLessons.topicId, topicIds),
            isNull(dbLessons.deletedAt),
            eq(dbLessons.status, "published")
          )
        )
        .orderBy(dbLessons.orderNumber)
    : [];

  // Fetch quizzes for these topics
  const quizzesList = topicIds.length > 0
    ? await db
        .select()
        .from(dbQuizzes)
        .where(inArray(dbQuizzes.topicId, topicIds))
    : [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Breadcrumb Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/dashboard/subjects" className="hover:text-blue-600">
                Subjects
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 dark:text-white font-bold">{subject.title}</span>
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl text-white shadow-xl space-y-3 border border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Structured Learning Roadmap
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{subject.title}</h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {subject.description}
              </p>
            </div>
          </div>

          {/* Topic Roadmap */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Topic Progression Roadmap
            </h2>

            <div className="space-y-6">
              {topics.map((topic, index) => {
                const topicLessons = lessonsList.filter((l) => l.topicId === topic.id);
                const topicQuiz = quizzesList.find((q) => q.topicId === topic.id);

                return (
                  <div
                    key={topic.id}
                    className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center">
                          0{index + 1}
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {topic.title}
                          </h3>
                          <p className="text-xs text-slate-500">{topic.description}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-300 dark:border-emerald-800">
                        Unlocked
                      </span>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Lessons
                      </p>
                      {topicLessons.map((les) => (
                        <div
                          key={les.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-blue-500/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {les.title}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                Duration: {Math.floor(les.duration / 60)} mins
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/lessons/${les.id}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shrink-0"
                          >
                            Watch Video
                          </Link>
                        </div>
                      ))}
                    </div>

                    {/* Topic Quiz Link */}
                    {topicQuiz && (
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                              {topicQuiz.title}
                            </p>
                            <span className="text-[10px] text-indigo-800 dark:text-indigo-300">
                              Passing score: {topicQuiz.passingScore}%
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/quizzes/${topicQuiz.id}`}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 shrink-0"
                        >
                          Start Quiz
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
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
