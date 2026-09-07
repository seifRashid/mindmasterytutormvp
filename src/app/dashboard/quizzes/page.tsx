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
  questions as dbQuestions,
  quizAttempts as dbAttempts,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import {
  INITIAL_QUIZZES,
  INITIAL_TOPICS,
  INITIAL_SUBJECTS,
  INITIAL_QUESTIONS,
} from "@/lib/mock-data";

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

  // 1. Fetch live data from database with graceful fallback
  let liveQuizzes: any[] = [];
  let liveTopics: any[] = [];
  let liveSubjects: any[] = [];
  let liveQuestions: any[] = [];
  let userAttempts: any[] = [];

  try {
    liveQuizzes = await db.select().from(dbQuizzes);
    liveTopics = await db.select().from(dbTopics);
    liveSubjects = await db.select().from(dbSubjects);
    liveQuestions = await db.select().from(dbQuestions);
    userAttempts = await db
      .select()
      .from(dbAttempts)
      .where(eq(dbAttempts.userId, userUuid));
  } catch (err) {
    console.error("Error loading database records in student quizzes page:", err);
  }

  // 2. Build lookups
  const topicMap = new Map<string, any>();
  INITIAL_TOPICS.forEach((t) => topicMap.set(t.id, t));
  liveTopics.forEach((t) => topicMap.set(t.id, t));

  const subjectMap = new Map<string, any>();
  INITIAL_SUBJECTS.forEach((s) => subjectMap.set(s.id, s));
  liveSubjects.forEach((s) => subjectMap.set(s.id, s));

  // Merge quizzes (Database first, then fallback mocks if not duplicated)
  const allQuizzesMap = new Map<string, any>();

  // Add mock quizzes
  INITIAL_QUIZZES.forEach((mq) => {
    allQuizzesMap.set(mq.id, {
      ...mq,
      isMock: true,
    });
  });

  // Add or override with DB quizzes
  liveQuizzes.forEach((lq) => {
    allQuizzesMap.set(lq.id, {
      id: lq.id,
      topicId: lq.topicId,
      lessonId: lq.lessonId,
      title: lq.title,
      passingScore: lq.passingScore,
      timeLimitMinutes: lq.timeLimitMinutes,
      showFeedback: lq.showFeedback,
      createdAt: lq.createdAt,
      isMock: false,
    });
  });

  // Calculate question metrics per quiz
  const questionsByQuiz = new Map<string, any[]>();
  INITIAL_QUESTIONS.forEach((q) => {
    const arr = questionsByQuiz.get(q.quizId) || [];
    arr.push(q);
    questionsByQuiz.set(q.quizId, arr);
  });
  liveQuestions.forEach((q) => {
    const arr = questionsByQuiz.get(q.quizId) || [];
    arr.push(q);
    questionsByQuiz.set(q.quizId, arr);
  });

  // Attempts by quiz lookup
  const attemptsByQuiz = new Map<string, any[]>();
  userAttempts.forEach((att) => {
    const arr = attemptsByQuiz.get(att.quizId) || [];
    arr.push(att);
    attemptsByQuiz.set(att.quizId, arr);
  });

  // 3. Transform into StudentQuizCardData
  const quizCards: StudentQuizCardData[] = Array.from(allQuizzesMap.values()).map((q) => {
    const parentTopic = q.topicId ? topicMap.get(q.topicId) : null;
    const parentSubject = parentTopic?.subjectId ? subjectMap.get(parentTopic.subjectId) : null;

    const quizQuestions = questionsByQuiz.get(q.id) || [];
    const openEndedCount = quizQuestions.filter(
      (ques) => ques.type === "open_ended" || ques.aiGradingEnabled
    ).length;
    const hasAiGrading = openEndedCount > 0;

    const myAttempts = attemptsByQuiz.get(q.id) || [];
    const attemptCount = myAttempts.length;

    let bestScore: number | null = null;
    let lastScore: number | null = null;
    let lastAttemptDate: string | null = null;
    let passed = false;

    if (attemptCount > 0) {
      bestScore = Math.max(...myAttempts.map((a) => a.score));
      lastScore = myAttempts[myAttempts.length - 1].score;
      lastAttemptDate = new Date(myAttempts[myAttempts.length - 1].createdAt).toLocaleDateString();
      passed = (bestScore ?? 0) >= (q.passingScore || 70);
    }

    return {
      id: q.id,
      title: q.title,
      topicTitle: parentTopic?.title || "Mastery Topic",
      subjectTitle: parentSubject?.title || "General",
      subjectSlug: parentSubject?.slug || "general",
      passingScore: q.passingScore || 70,
      timeLimitMinutes: q.timeLimitMinutes || 0,
      showFeedback: q.showFeedback ?? true,
      questionCount: quizQuestions.length > 0 ? quizQuestions.length : 3,
      hasAiGrading,
      openEndedCount,
      attemptCount,
      bestScore,
      lastScore,
      passed,
      lastAttemptDate,
    };
  });

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
