import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StudentQuizList, StudentQuizCardData } from "@/components/student/StudentQuizList";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  topics as dbTopics,
  subjects as dbSubjects,
  lessons as dbLessons,
  questions as dbQuestions,
  quizAttempts as dbAttempts,
} from "@/db/schema";
import { eq, and, isNull, inArray, or } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function StudentQuizzesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentUser = await findUserById(session.id);
  const status = currentUser?.status || session?.status || "approved";

  if (!currentUser || status === "pending" || status === "rejected") {
    redirect("/pending-approval");
  }

  const userUuid = toUuid(currentUser.id);
  const isStudent = currentUser.role === "student";
  const studentClassUuid = currentUser.classId ? toUuid(currentUser.classId) : null;

  // 1. Fetch authorized active quizzes from database
  let quizCards: StudentQuizCardData[] = [];

  try {
    let subjectIds: string[] = [];
    let topicIds: string[] = [];
    let lessonIds: string[] = [];

    // Map lookups
    const topicMap = new Map<string, any>();
    const subjectMap = new Map<string, any>();

    if (isStudent && studentClassUuid) {
      // Find subjects belonging to the student's class
      const classSubjects = await db
        .select()
        .from(dbSubjects)
        .where(eq(dbSubjects.classId, studentClassUuid));

      subjectIds = classSubjects.map((s) => s.id);
      classSubjects.forEach((s) => subjectMap.set(s.id, s));

      if (subjectIds.length > 0) {
        const classTopics = await db
          .select()
          .from(dbTopics)
          .where(inArray(dbTopics.subjectId, subjectIds));

        topicIds = classTopics.map((t) => t.id);
        classTopics.forEach((t) => topicMap.set(t.id, t));

        if (topicIds.length > 0) {
          const classLessons = await db
            .select({ id: dbLessons.id, topicId: dbLessons.topicId })
            .from(dbLessons)
            .where(
              and(
                inArray(dbLessons.topicId, topicIds),
                isNull(dbLessons.deletedAt),
                eq(dbLessons.status, "published")
              )
            );

          lessonIds = classLessons.map((l) => l.id);
        }
      }
    } else {
      // Admin / Teacher preview: load all subjects and topics
      const allSubjects = await db.select().from(dbSubjects);
      allSubjects.forEach((s) => subjectMap.set(s.id, s));

      const allTopics = await db.select().from(dbTopics);
      allTopics.forEach((t) => topicMap.set(t.id, t));
      topicIds = allTopics.map((t) => t.id);

      const allLessons = await db
        .select({ id: dbLessons.id })
        .from(dbLessons)
        .where(isNull(dbLessons.deletedAt));
      lessonIds = allLessons.map((l) => l.id);
    }

    // Query active non-deleted quizzes belonging to authorized topics or lessons
    let activeQuizzes: any[] = [];
    if (topicIds.length > 0 || lessonIds.length > 0) {
      const conditions = [];
      if (topicIds.length > 0) {
        conditions.push(inArray(dbQuizzes.topicId, topicIds));
      }
      if (lessonIds.length > 0) {
        conditions.push(inArray(dbQuizzes.lessonId, lessonIds));
      }

      activeQuizzes = await db
        .select()
        .from(dbQuizzes)
        .where(
          and(
            isNull(dbQuizzes.deletedAt),
            conditions.length === 1 ? conditions[0] : or(...conditions)
          )
        );
    }

    if (activeQuizzes.length > 0) {
      const quizIds = activeQuizzes.map((q) => q.id);

      // Fetch questions for active quizzes
      const allQuestions = await db
        .select()
        .from(dbQuestions)
        .where(inArray(dbQuestions.quizId, quizIds))
        .orderBy(dbQuestions.orderNumber);

      const questionsByQuiz = new Map<string, any[]>();
      allQuestions.forEach((q) => {
        const arr = questionsByQuiz.get(q.quizId) || [];
        arr.push(q);
        questionsByQuiz.set(q.quizId, arr);
      });

      // Fetch student attempts
      const myAttempts = await db
        .select()
        .from(dbAttempts)
        .where(
          and(
            eq(dbAttempts.userId, userUuid),
            inArray(dbAttempts.quizId, quizIds)
          )
        );

      const attemptsByQuiz = new Map<string, any[]>();
      myAttempts.forEach((a) => {
        const arr = attemptsByQuiz.get(a.quizId) || [];
        arr.push(a);
        attemptsByQuiz.set(a.quizId, arr);
      });

      // Transform into StudentQuizCardData
      quizCards = activeQuizzes.map((q) => {
        const parentTopic = q.topicId ? topicMap.get(q.topicId) : null;
        const parentSubject = parentTopic?.subjectId ? subjectMap.get(parentTopic.subjectId) : null;

        const quizQuestions = questionsByQuiz.get(q.id) || [];
        const openEndedCount = quizQuestions.filter(
          (ques) => ques.type === "open_ended" || ques.aiGradingEnabled
        ).length;
        const hasAiGrading = openEndedCount > 0;

        const attempts = attemptsByQuiz.get(q.id) || [];
        const attemptCount = attempts.length;

        let bestScore: number | null = null;
        let lastScore: number | null = null;
        let lastAttemptDate: string | null = null;
        let passed = false;

        if (attemptCount > 0) {
          bestScore = Math.max(...attempts.map((a) => a.score));
          lastScore = attempts[attempts.length - 1].score;
          lastAttemptDate = new Date(attempts[attempts.length - 1].createdAt).toLocaleDateString();
          passed = (bestScore ?? 0) >= (q.passingScore || 70);
        }

        return {
          id: q.id,
          title: q.title,
          topicTitle: parentTopic?.title || "Curriculum Unit",
          subjectTitle: parentSubject?.title || "Assigned Subject",
          subjectSlug: parentSubject?.slug || "curriculum",
          passingScore: q.passingScore || 70,
          timeLimitMinutes: q.timeLimitMinutes || 0,
          showFeedback: q.showFeedback ?? true,
          questionCount: quizQuestions.length,
          hasAiGrading,
          openEndedCount,
          attemptCount,
          bestScore,
          lastScore,
          passed,
          lastAttemptDate,
        };
      });
    }
  } catch (err) {
    console.error("Error loading student quizzes from database:", err);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 pb-24 md:pb-8 space-y-8 overflow-y-auto">
          <StudentQuizList quizzes={quizCards} studentName={currentUser.name || "Student"} />
        </main>
      </div>
    </div>
  );
}
