import {
  TrendingUp,
  Award,
  Video,
  Flame,
  Sparkles,
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
  lessonProgress as dbProgress,
  quizAttempts as dbAttempts,
} from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import { redirect } from "next/navigation";

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

export default async function StudentProgressPage() {
  const session = await getSession();
  const currentUser = session ? await findUserById(session.id) : null;

  if (!currentUser) {
    redirect("/login");
  }

  const userUuid = toUuid(currentUser.id);

  // 1. Get Completed Video Lessons Count
  const completedProgress = await db
    .select()
    .from(dbProgress)
    .where(and(eq(dbProgress.userId, userUuid), eq(dbProgress.completed, true)));
  const completedLessonsCount = completedProgress.length;

  // 2. Get Avg Quiz Accuracy Score & Passed Quizzes (Badges)
  const attempts = await db
    .select()
    .from(dbAttempts)
    .where(eq(dbAttempts.userId, userUuid));

  const avgQuizScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;

  // Badge count corresponds to passed quizzes (score >= 70)
  const passedQuizIds = new Set(
    attempts.filter((a) => a.score >= 70).map((a) => a.quizId)
  );
  const badgesCount = passedQuizIds.size;

  // 3. Get Learning Streak
  const streakDays = await getStreakDays(currentUser.id);

  // 4. Get Enrolled Subjects & Dynamic Progress Breakdown
  const classUuid = currentUser.classId ? toUuid(currentUser.classId) : null;
  const studentSubjects = classUuid
    ? await db.select().from(dbSubjects).where(eq(dbSubjects.classId, classUuid))
    : [];

  const subjectProgressList = [];

  for (const sub of studentSubjects) {
    // Get all topics for this subject
    const topicsList = await db
      .select()
      .from(dbTopics)
      .where(eq(dbTopics.subjectId, sub.id));

    let percent = 0;

    if (topicsList.length > 0) {
      const topicIds = topicsList.map((t) => t.id);
      // Get all lessons for these topics
      const lessonsList = await db
        .select()
        .from(dbLessons)
        .where(
          and(
            inArray(dbLessons.topicId, topicIds),
            isNull(dbLessons.deletedAt)
          )
        );

      if (lessonsList.length > 0) {
        const lessonIds = lessonsList.map((l) => l.id);
        const completedInSub = await db
          .select()
          .from(dbProgress)
          .where(
            and(
              eq(dbProgress.userId, userUuid),
              eq(dbProgress.completed, true),
              inArray(dbProgress.lessonId, lessonIds)
            )
          );
        percent = Math.round((completedInSub.length / lessonsList.length) * 100);
      }
    }

    subjectProgressList.push({
      ...sub,
      percent,
    });
  }

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
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {completedLessonsCount} {completedLessonsCount === 1 ? "Lesson" : "Lessons"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Completed Video Lessons</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {avgQuizScore}% Avg
              </p>
              <p className="text-xs text-slate-500 font-medium">Quiz Accuracy Score</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {streakDays} {streakDays === 1 ? "Day" : "Days"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Current Learning Streak</p>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {badgesCount} {badgesCount === 1 ? "Badge" : "Badges"}
              </p>
              <p className="text-xs text-slate-500 font-medium">Mastery Certificates</p>
            </div>
          </div>

          {/* Subject Breakdown */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Subject Completion Percentages
            </h2>

            {subjectProgressList.length > 0 ? (
              <div className="space-y-4">
                {subjectProgressList.map((sub) => (
                  <div key={sub.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900 dark:text-white">{sub.title}</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {sub.percent}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${sub.percent}%` }}
                      />
                    </div>
                  </div>
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

