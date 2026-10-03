import Link from "next/link";
import {
  BookOpen,
  Play,
  Award,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Brain,
  RotateCcw,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";
import { findUserById } from "@/lib/user-store";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  subjects as dbSubjects,
  topics as dbTopics,
  lessons as dbLessons,
  lessonProgress as dbProgress,
  quizAttempts as dbAttempts,
  quizzes as dbQuizzes,
  questions as dbQuestions,
} from "@/db/schema";
import { eq, and, inArray, isNull, or } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

// Helper function to calculate calendar streak
async function getStreakDays(userId: string): Promise<number> {
  const userUuid = toUuid(userId);

  const progressLogs = await db
    .select({ date: dbProgress.updatedAt })
    .from(dbProgress)
    .where(eq(dbProgress.userId, userUuid));

  const quizLogs = await db
    .select({ date: dbAttempts.createdAt })
    .from(dbAttempts)
    .where(eq(dbAttempts.userId, userUuid));

  const activeDates = new Set<string>();

  const addDate = (d: Date) => {
    if (!d) return;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    activeDates.add(`${year}-${month}-${day}`);
  };

  progressLogs.forEach((p) => addDate(p.date));
  quizLogs.forEach((q) => addDate(q.date));

  if (activeDates.size === 0) return 0;

  let streak = 0;
  const today = new Date();

  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  let checkDate = new Date(today);
  let formatted = formatDate(checkDate);

  if (!activeDates.has(formatted)) {
    checkDate.setDate(checkDate.getDate() - 1);
    formatted = formatDate(checkDate);
    if (!activeDates.has(formatted)) {
      return 0;
    }
  }

  while (activeDates.has(formatted)) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    formatted = formatDate(checkDate);
  }

  return streak;
}

export default async function StudentDashboardPage() {
  const session = await getSession();

  // Guard: if student account is pending or rejected, redirect to approval status page
  const currentUser = session ? await findUserById(session.id) : null;
  const status = currentUser?.status || session?.status || "approved";

  if (!currentUser || status === "pending" || status === "rejected") {
    redirect("/pending-approval");
  }

  const userUuid = toUuid(currentUser.id);

  // 1. Calculate Learning Streak
  const streakDays = await getStreakDays(currentUser.id);

  // 2. Fetch Subjects and Progress
  const classUuid = currentUser.classId ? toUuid(currentUser.classId) : null;
  const studentSubjects = classUuid
    ? await db.select().from(dbSubjects).where(eq(dbSubjects.classId, classUuid))
    : [];

  const subjectProgressList: any[] = [];
  let resumeSubject: any = null;
  let resumeLesson: any = null;

  if (studentSubjects.length > 0) {
    const subjectIds = studentSubjects.map((s) => s.id);

    // Get all topics for student's subjects
    const topicsList = await db
      .select()
      .from(dbTopics)
      .where(inArray(dbTopics.subjectId, subjectIds))
      .orderBy(dbTopics.orderNumber);

    if (topicsList.length > 0) {
      const topicIds = topicsList.map((t) => t.id);

      // Get all lessons for these topics
      const lessonsList = await db
        .select()
        .from(dbLessons)
        .where(
          and(
            inArray(dbLessons.topicId, topicIds),
            isNull(dbLessons.deletedAt),
            eq(dbLessons.status, "published")
          )
        )
        .orderBy(dbLessons.orderNumber);

      if (lessonsList.length > 0) {
        const lessonIds = lessonsList.map((l) => l.id);

        // Get completed progress records for these lessons
        const completedProgress = await db
          .select()
          .from(dbProgress)
          .where(
            and(
              eq(dbProgress.userId, userUuid),
              eq(dbProgress.completed, true),
              inArray(dbProgress.lessonId, lessonIds)
            )
          );

        const completedSet = new Set(completedProgress.map((p) => p.lessonId));

        // Find the first uncompleted lesson
        const nextLesson = lessonsList.find((l) => !completedSet.has(l.id));

        if (nextLesson) {
          resumeLesson = nextLesson;
          const parentTopic = topicsList.find((t) => t.id === nextLesson.topicId);
          resumeSubject = studentSubjects.find((s) => s.id === parentTopic?.subjectId);
        } else {
          // All lessons completed — fallback to first lesson
          resumeLesson = lessonsList[0];
          const parentTopic = topicsList.find((t) => t.id === resumeLesson.topicId);
          resumeSubject = studentSubjects.find((s) => s.id === parentTopic?.subjectId);
        }

        // Calculate progress percentage for each subject
        for (const sub of studentSubjects) {
          const subTopics = topicsList.filter((t) => t.subjectId === sub.id);
          const subTopicIds = subTopics.map((t) => t.id);
          const subLessons = lessonsList.filter((l) => subTopicIds.includes(l.topicId));
          const subLessonIds = subLessons.map((l) => l.id);

          let percent = 0;
          if (subLessons.length > 0) {
            const completedInSub = completedProgress.filter((p) =>
              subLessonIds.includes(p.lessonId)
            );
            percent = Math.round((completedInSub.length / subLessons.length) * 100);
          }

          subjectProgressList.push({
            ...sub,
            topicsCount: subTopics.length,
            percent,
          });
        }
      }
    }
  }

  // 3. Fetch Featured Quizzes for Student (Scoped to enrolled class)
  let featuredQuizzes: any[] = [];
  try {
    let activeQuizzes: any[] = [];

    if (studentSubjects.length > 0) {
      const subjectIds = studentSubjects.map((s) => s.id);
      const subjectMap = new Map<string, any>(studentSubjects.map((s) => [s.id, s]));

      const topicsList = await db
        .select()
        .from(dbTopics)
        .where(inArray(dbTopics.subjectId, subjectIds));
      const topicMap = new Map<string, any>(topicsList.map((t) => [t.id, t]));
      const topicIds = topicsList.map((t) => t.id);

      let lessonIds: string[] = [];
      if (topicIds.length > 0) {
        const lessons = await db
          .select({ id: dbLessons.id })
          .from(dbLessons)
          .where(
            and(
              inArray(dbLessons.topicId, topicIds),
              isNull(dbLessons.deletedAt),
              eq(dbLessons.status, "published")
            )
          );
        lessonIds = lessons.map((l) => l.id);
      }

      if (topicIds.length > 0 || lessonIds.length > 0) {
        const quizConditions = [];
        if (topicIds.length > 0) {
          quizConditions.push(inArray(dbQuizzes.topicId, topicIds));
        }
        if (lessonIds.length > 0) {
          quizConditions.push(inArray(dbQuizzes.lessonId, lessonIds));
        }

        activeQuizzes = await db
          .select()
          .from(dbQuizzes)
          .where(
            and(
              isNull(dbQuizzes.deletedAt),
              quizConditions.length === 1 ? quizConditions[0] : or(...quizConditions)
            )
          );

        if (activeQuizzes.length > 0) {
          const quizIds = activeQuizzes.map((q) => q.id);

          const dbQuestionList = await db
            .select()
            .from(dbQuestions)
            .where(inArray(dbQuestions.quizId, quizIds));

          const myAttempts = await db
            .select()
            .from(dbAttempts)
            .where(
              and(
                eq(dbAttempts.userId, userUuid),
                inArray(dbAttempts.quizId, quizIds)
              )
            );

          const questionsByQuiz = new Map<string, any[]>();
          dbQuestionList.forEach((q) => {
            const arr = questionsByQuiz.get(q.quizId) || [];
            arr.push(q);
            questionsByQuiz.set(q.quizId, arr);
          });

          const attemptsMap = new Map<string, any[]>();
          myAttempts.forEach((a) => {
            const arr = attemptsMap.get(a.quizId) || [];
            arr.push(a);
            attemptsMap.set(a.quizId, arr);
          });

          featuredQuizzes = activeQuizzes.map((q) => {
            const topic = q.topicId ? topicMap.get(q.topicId) : null;
            const sub = topic?.subjectId ? subjectMap.get(topic.subjectId) : null;
            const qQuestions = questionsByQuiz.get(q.id) || [];
            const hasAiGrading = qQuestions.some(
              (ques) => ques.type === "open_ended" || ques.aiGradingEnabled
            );
            const userAtts = attemptsMap.get(q.id) || [];
            const bestScore = userAtts.length > 0 ? Math.max(...userAtts.map((a) => a.score)) : null;
            const isPassed = (bestScore ?? 0) >= (q.passingScore || 70);

            return {
              id: q.id,
              title: q.title,
              topicTitle: topic?.title || "Mastery Topic",
              subjectTitle: sub?.title || "Curriculum",
              passingScore: q.passingScore || 70,
              timeLimitMinutes: q.timeLimitMinutes || 0,
              questionCount: qQuestions.length,
              hasAiGrading,
              bestScore,
              isPassed,
              hasAttempts: userAtts.length > 0,
            };
          });
        }
      }
    }
  } catch (err) {
    console.error("Error fetching featured quizzes for student dashboard:", err);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 space-y-8 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
                Student Learning Portal
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                Welcome back, {session?.name || "David"}! 👋
              </h1>
              <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
                Continue building your knowledge, exploring your enrolled subjects, and mastering your lessons.
              </p>
            </div>
          </div>

          {/* Continue Learning Widget */}
          {resumeLesson && resumeSubject && (
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
                    {resumeSubject.title}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {resumeLesson.title}
                  </h3>
                  {resumeLesson.description && (
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {resumeLesson.description}
                    </p>
                  )}
                </div>

                <Link
                  href={`/dashboard/lessons/${resumeLesson.id}`}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  Watch Lesson
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

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

            {subjectProgressList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subjectProgressList.map((sub) => (
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
                        {sub.percent}% Done
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
                        style={{ width: `${sub.percent}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between pt-1">
                      <span>{sub.topicsCount} Topics</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        Resume Roadmap <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No active subjects found for your enrolled class. Please contact your teacher.
              </p>
            )}
          </div>

          {/* Interactive Practice Quizzes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Interactive Practice Quizzes
                </h2>
                <p className="text-xs text-slate-500">
                  Assess your understanding with automated multiple-choice and AI-evaluated open-ended questions.
                </p>
              </div>
              <Link
                href="/dashboard/quizzes"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All Quizzes ({featuredQuizzes.length}) →
              </Link>
            </div>

            {featuredQuizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredQuizzes.slice(0, 3).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
                          {quiz.subjectTitle}
                        </span>
                        {quiz.hasAttempts ? (
                          quiz.isPassed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Passed ({quiz.bestScore}%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                              Best: {quiz.bestScore}%
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400">Ready to start</span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        {quiz.topicTitle}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                        <span>{quiz.questionCount} Questions</span>
                        {quiz.hasAiGrading && (
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Brain className="w-3 h-3" /> AI Graded
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Pass mark: <strong className="text-slate-700 dark:text-slate-300">{quiz.passingScore}%</strong>
                      </span>
                      <Link
                        href={`/dashboard/quizzes/${quiz.id}`}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {quiz.hasAttempts ? (
                          <>
                            <RotateCcw className="w-3 h-3" /> Retake
                          </>
                        ) : (
                          <>
                            Start Quiz <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No practice quizzes are currently published. Check back soon!
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
