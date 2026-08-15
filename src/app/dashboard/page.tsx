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
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
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
        .where(inArray(dbLessons.topicId, topicIds))
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
                {streakDays > 0 ? (
                  <>
                    You are on a <span className="font-bold underline text-white">{streakDays}-{streakDays === 1 ? "day" : "day"} learning streak</span>. Keep building your mastery!
                  </>
                ) : (
                  "Welcome! Start your learning journey by watching your first lesson today."
                )}
              </p>
            </div>

            {streakDays > 0 && (
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-lg">
                  <Flame className="w-7 h-7 fill-current" />
                </div>
                <div>
                  <p className="text-xl font-black">{streakDays} {streakDays === 1 ? "Day" : "Days"}</p>
                  <p className="text-[11px] text-blue-100 font-medium">Active Learning Streak</p>
                </div>
              </div>
            )}
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
        </main>
      </div>
    </div>
  );
}
