import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuizBuilder, QuestionItem } from "@/components/admin/QuizBuilder";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import { INITIAL_QUESTIONS, INITIAL_QUIZZES } from "@/lib/mock-data";

export default async function TeacherEditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    redirect("/login");
  }

  const { quizId } = await params;
  const quizUuid = toUuid(quizId);

  // 1. Fetch Quiz from database
  const quizResults = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizUuid));
  let quiz = quizResults[0] || null;

  if (!quiz) {
    const mockQuiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
    if (mockQuiz) {
      quiz = {
        id: mockQuiz.id,
        topicId: mockQuiz.topicId || null,
        lessonId: null,
        createdBy: null,
        title: mockQuiz.title,
        passingScore: mockQuiz.passingScore,
        timeLimitMinutes: 0,
        showFeedback: mockQuiz.showFeedback ?? true,
        deletedAt: mockQuiz.deletedAt ? new Date(mockQuiz.deletedAt) : null,
        createdAt: new Date(mockQuiz.createdAt),
      };
    }
  }

  if (!quiz) {
    notFound();
  }

  // Permission verification:
  // Teacher should only edit quizzes that were created by them except for admin who has full rights
  const userUuid = session?.id ? toUuid(session.id) : null;
  const isOwner = Boolean(userUuid && quiz.createdBy && toUuid(quiz.createdBy) === userUuid);
  const isAdmin = session?.role === "admin";

  if (!isAdmin && !isOwner && quiz.createdBy) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
        <Navbar user={session} />
        <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
          <Sidebar role="teacher" />
          <main className="flex-1 min-w-0 p-8 flex flex-col items-center justify-center text-center">
            <div className="max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Permission Restricted</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                You can only edit quizzes that were created by you. This quiz was authored by another educator or administrator.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/teacher/quizzes"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Return to Quizzes
                </Link>
                <Link
                  href="/dashboard/quizzes"
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  All Quizzes
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 2. Fetch Questions & Answers
  let questions: QuestionItem[] = [];
  const dbQuestionList = await db
    .select()
    .from(dbQuestions)
    .where(eq(dbQuestions.quizId, quizUuid))
    .orderBy(dbQuestions.orderNumber);

  if (dbQuestionList.length > 0) {
    const questionIds = dbQuestionList.map((q) => q.id);
    const dbAnswerList = await db
      .select()
      .from(dbAnswers)
      .where(inArray(dbAnswers.questionId, questionIds));

    questions = dbQuestionList.map((q, idx) => ({
      id: q.id,
      type: q.type as any,
      question: q.question,
      explanation: q.explanation || "",
      orderNumber: q.orderNumber || idx + 1,
      maxMarks: q.maxMarks || 1,
      aiGradingEnabled: q.aiGradingEnabled ?? false,
      expectedAnswer: q.expectedAnswer || "",
      keyConcepts: (q.keyConcepts as string[]) || [],
      acceptableAnswers: (q.acceptableAnswers as string[]) || [],
      commonMisconceptions: (q.commonMisconceptions as string[]) || [],
      gradingRubric: (q.gradingRubric as any) || [],
      answers: dbAnswerList
        .filter((a) => a.questionId === q.id)
        .map((a) => ({
          id: a.id,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
    }));
  } else {
    // Check mock questions fallback
    const mockQuestions = INITIAL_QUESTIONS.filter((q) => q.quizId === quizId);
    if (mockQuestions.length > 0) {
      questions = mockQuestions.map((q, idx) => ({
        id: q.id,
        type: q.type as any,
        question: q.question,
        explanation: q.explanation || "",
        orderNumber: q.orderNumber || idx + 1,
        answers: q.answers.map((a) => ({
          id: a.id,
          answer: a.answer,
          isCorrect: a.isCorrect,
        })),
      }));
    }
  }

  // 3. Fetch Topics for dropdown
  const allTopics = await db.select().from(dbTopics).orderBy(dbTopics.orderNumber);
  const allSubjects = await db.select().from(dbSubjects);
  const allClasses = await db.select().from(dbClasses);

  const topicOptions = allTopics.map((t) => {
    const sub = allSubjects.find((s) => s.id === t.subjectId);
    const cls = sub ? allClasses.find((c) => c.id === sub.classId) : null;
    return {
      id: t.id,
      title: t.title,
      subjectTitle: sub ? `${sub.title}${cls ? ` - ${cls.name}` : ""}` : undefined,
    };
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <QuizBuilder
            role="teacher"
            initialQuiz={quiz}
            initialQuestions={questions}
            topics={topicOptions}
            isEditing={true}
          />
        </main>
      </div>
    </div>
  );
}
