import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Play,
  Award,
  ArrowRight,
  ChevronRight,
  Lock,
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { db } from "@/db";
import {
  subjects as dbSubjects,
  topics as dbTopics,
  lessons as dbLessons,
  quizzes as dbQuizzes,
  classes as dbClasses,
  lessonProgress as dbProgress,
  quizAttempts as dbAttempts,
} from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectSlug: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentUser = await findUserById(session.id);
  const status = currentUser?.status || session?.status || "approved";

  if (!currentUser || status === "pending" || status === "rejected") {
    redirect("/pending-approval");
  }

  const { subjectSlug } = await params;
  const userUuid = toUuid(currentUser.id);
  const isStudent = currentUser.role === "student";

  // 1. Fetch Subject from Neon PostgreSQL
  const dbSub = await db
    .select()
    .from(dbSubjects)
    .where(eq(dbSubjects.slug, subjectSlug));

  if (dbSub.length === 0) {
    notFound();
  }
  const subject = dbSub[0];

  // 2. Fetch Parent Class
  let parentClass = null;
  if (subject.classId) {
    const classRows = await db
      .select()
      .from(dbClasses)
      .where(eq(dbClasses.id, subject.classId));
    if (classRows.length > 0) {
      parentClass = classRows[0];
    }
  }

  // 3. Enforce Server-Side Class Isolation
  const studentClassUuid = currentUser.classId ? toUuid(currentUser.classId) : null;
  const isAuthorized = !isStudent || !studentClassUuid || studentClassUuid === subject.classId;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
        <Navbar user={session} />
        <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
          <Sidebar role="student" />
          <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 flex items-center justify-center">
            <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Content Restricted
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This subject is designated for <strong>{parentClass?.name || "another class"}</strong>. Your account is assigned to a different grade level.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/subjects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  View Your Enrolled Subjects
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 4. Fetch Topics for this Subject
  const topics = await db
    .select()
    .from(dbTopics)
    .where(eq(dbTopics.subjectId, subject.id))
    .orderBy(dbTopics.orderNumber);

  const topicIds = topics.map((t) => t.id);

  // 5. Fetch Active Published Lessons
  let lessonsList: Array<{
    id: string;
    topicId: string;
    title: string;
    description: string | null;
    duration: number;
    orderNumber: number;
    richContent: string | null;
    videoUrl: string | null;
    lessonQuizId: string | null;
  }> = [];

  if (topicIds.length > 0) {
    lessonsList = await db
      .select({
        id: dbLessons.id,
        topicId: dbLessons.topicId,
        title: dbLessons.title,
        description: dbLessons.description,
        duration: dbLessons.duration,
        orderNumber: dbLessons.orderNumber,
        richContent: dbLessons.richContent,
        videoUrl: dbLessons.videoUrl,
        lessonQuizId: dbLessons.lessonQuizId,
      })
      .from(dbLessons)
      .where(
        and(
          inArray(dbLessons.topicId, topicIds),
          isNull(dbLessons.deletedAt),
          eq(dbLessons.status, "published")
        )
      )
      .orderBy(dbLessons.orderNumber);
  }

  const lessonIds = lessonsList.map((l) => l.id);

  // 6. Fetch Active Quizzes (Topic Quizzes & Lesson Quizzes)
  let quizzesList: Array<{
    id: string;
    topicId: string | null;
    lessonId: string | null;
    title: string;
    passingScore: number;
    timeLimitMinutes: number;
    showFeedback: boolean;
  }> = [];

  if (topicIds.length > 0) {
    quizzesList = await db
      .select({
        id: dbQuizzes.id,
        topicId: dbQuizzes.topicId,
        lessonId: dbQuizzes.lessonId,
        title: dbQuizzes.title,
        passingScore: dbQuizzes.passingScore,
        timeLimitMinutes: dbQuizzes.timeLimitMinutes,
        showFeedback: dbQuizzes.showFeedback,
      })
      .from(dbQuizzes)
      .where(
        and(
          isNull(dbQuizzes.deletedAt),
          inArray(dbQuizzes.topicId, topicIds)
        )
      );
  }

  // 7. Fetch Student Completion Progress
  let completedLessonSet = new Set<string>();
  let passedQuizSet = new Set<string>();
  let quizBestScores = new Map<string, number>();

  if (isStudent) {
    if (lessonIds.length > 0) {
      const progressRecords = await db
        .select({ lessonId: dbProgress.lessonId })
        .from(dbProgress)
        .where(
          and(
            eq(dbProgress.userId, userUuid),
            eq(dbProgress.completed, true),
            inArray(dbProgress.lessonId, lessonIds)
          )
        );
      completedLessonSet = new Set(progressRecords.map((p) => p.lessonId));
    }

    const quizIds = quizzesList.map((q) => q.id);
    if (quizIds.length > 0) {
      const attemptRecords = await db
        .select({
          quizId: dbAttempts.quizId,
          score: dbAttempts.score,
        })
        .from(dbAttempts)
        .where(
          and(
            eq(dbAttempts.userId, userUuid),
            inArray(dbAttempts.quizId, quizIds)
          )
        );

      attemptRecords.forEach((a) => {
        const prev = quizBestScores.get(a.quizId) ?? -1;
        if (a.score > prev) {
          quizBestScores.set(a.quizId, a.score);
        }
      });

      quizzesList.forEach((q) => {
        const best = quizBestScores.get(q.id) ?? null;
        if (best !== null && best >= q.passingScore) {
          passedQuizSet.add(q.id);
        }
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Breadcrumb Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/dashboard/subjects" className="hover:text-blue-600 transition-colors">
                Enrolled Subjects
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              {parentClass && (
                <>
                  <span>{parentClass.name}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
              <span className="text-slate-900 dark:text-white font-bold">{subject.title}</span>
            </div>

            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl text-white shadow-xl space-y-3 border border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Structured Learning Roadmap
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{subject.title}</h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {subject.description || "Follow the step-by-step topic roadmap below to master lessons, study notes, watch videos, and pass interactive quizzes."}
              </p>
            </div>
          </div>

          {/* Topic Roadmap */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Curriculum Progression Roadmap
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {topics.length} {topics.length === 1 ? "Topic" : "Topics"} · {lessonsList.length} {lessonsList.length === 1 ? "Lesson" : "Lessons"}
              </span>
            </div>

            {topics.length > 0 ? (
              <div className="space-y-6">
                {topics.map((topic, index) => {
                  const topicLessons = lessonsList.filter((l) => l.topicId === topic.id);
                  const topicQuiz = quizzesList.find((q) => q.topicId === topic.id);
                  const isQuizPassed = topicQuiz ? passedQuizSet.has(topicQuiz.id) : false;
                  const quizScore = topicQuiz ? quizBestScores.get(topicQuiz.id) : null;

                  return (
                    <div
                      key={topic.id}
                      className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {topic.title}
                            </h3>
                            {topic.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          {topicLessons.length} {topicLessons.length === 1 ? "Lesson" : "Lessons"}
                        </span>
                      </div>

                      {/* Lessons List */}
                      {topicLessons.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Lessons in this Unit
                          </p>
                          {topicLessons.map((les) => {
                            const isCompleted = completedLessonSet.has(les.id);
                            return (
                              <div
                                key={les.id}
                                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                                  isCompleted
                                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-500/50"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                      isCompleted
                                        ? "bg-emerald-600 text-white"
                                        : "bg-blue-600 text-white"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-current ml-0.5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                      {les.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                      {les.duration > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {Math.floor(les.duration / 60)}m {les.duration % 60}s
                                        </span>
                                      )}
                                      {isCompleted && (
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                          Completed ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Link
                                  href={`/dashboard/lessons/${les.id}`}
                                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 transition-all shrink-0 ${
                                    isCompleted
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  }`}
                                >
                                  {isCompleted ? "Review" : "Study"}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-xs text-slate-400">
                            Lessons for this topic will be published by your instructor soon.
                          </p>
                        </div>
                      )}

                      {/* Topic Assessment Quiz */}
                      {topicQuiz && (
                        <div
                          className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                            isQuizPassed
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                              : "bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-200 dark:border-indigo-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isQuizPassed ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                              }`}
                            >
                              <Award className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                                {topicQuiz.title}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                                <span>Passing score: {topicQuiz.passingScore}%</span>
                                {quizScore !== null && quizScore !== undefined && (
                                  <span className="font-bold">
                                    · Best Score: {quizScore}% {isQuizPassed ? "✓" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/quizzes/${topicQuiz.id}`}
                            className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-all ${
                              isQuizPassed
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {quizScore !== null && quizScore !== undefined ? (
                              <>
                                <RotateCcw className="w-3 h-3" /> Retake Quiz
                              </>
                            ) : (
                              <>
                                Start Quiz <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Topics Published Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The topics and lesson units for this subject are currently being prepared. Check back shortly!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
