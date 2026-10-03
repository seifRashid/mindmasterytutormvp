import { notFound, redirect } from "next/navigation";
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

export default async function AdminEditQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    redirect("/login");
  }

  const { quizId } = await params;
  const quizUuid = toUuid(quizId);

  // 1. Fetch Quiz from database (with mock fallback if needed)
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
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <QuizBuilder
            role="admin"
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
