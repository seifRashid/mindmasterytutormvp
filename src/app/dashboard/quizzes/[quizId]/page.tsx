import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, HelpCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuizEngine } from "@/components/student/QuizEngine";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
  topics as dbTopics,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import {
  INITIAL_QUIZZES,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
} from "@/lib/mock-data";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await getSession();
  const { quizId } = await params;

  const quizUuid = toUuid(quizId);

  // 1. Fetch quiz details from database or mock fallback
  let quiz: any = null;
  try {
    const quizResult = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizUuid));
    if (quizResult.length > 0) {
      quiz = quizResult[0];
    }
  } catch (err) {
    console.warn("Could not query dbQuizzes, checking mock fallback:", err);
  }

  if (!quiz) {
    const mockQuiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
    if (mockQuiz) {
      quiz = {
        id: mockQuiz.id,
        topicId: mockQuiz.topicId || null,
        lessonId: mockQuiz.lessonId || null,
        title: mockQuiz.title,
        passingScore: mockQuiz.passingScore,
        timeLimitMinutes: mockQuiz.timeLimitMinutes || 0,
        showFeedback: mockQuiz.showFeedback ?? true,
        createdAt: new Date(mockQuiz.createdAt),
      };
    }
  }

  if (!quiz) notFound();

  // 2. Fetch quiz questions
  let questions: any[] = [];
  try {
    const questionsList = await db
      .select()
      .from(dbQuestions)
      .where(eq(dbQuestions.quizId, quizUuid))
      .orderBy(dbQuestions.orderNumber);

    if (questionsList.length > 0) {
      const questionIds = questionsList.map((q) => q.id);
      const answersList = await db
        .select()
        .from(dbAnswers)
        .where(inArray(dbAnswers.questionId, questionIds));

      questions = questionsList.map((q) => ({
        id: q.id,
        quizId: q.quizId,
        type: q.type,
        question: q.question,
        explanation: q.explanation,
        orderNumber: q.orderNumber,
        maxMarks: q.maxMarks || 1,
        aiGradingEnabled: q.aiGradingEnabled,
        answers: answersList
          .filter((a) => a.questionId === q.id)
          .map((a) => ({
            id: a.id,
            questionId: a.questionId,
            answer: a.answer,
            isCorrect: a.isCorrect,
          })),
      }));
    }
  } catch (err) {
    console.warn("Could not query dbQuestions, checking mock fallback:", err);
  }

  if (questions.length === 0) {
    const mockQuestions = INITIAL_QUESTIONS.filter((q) => q.quizId === quizId);
    questions = mockQuestions.map((q, idx) => ({
      id: q.id,
      quizId: q.quizId,
      type: q.type || "multiple_choice",
      question: q.question,
      explanation: q.explanation || "",
      orderNumber: q.orderNumber || idx + 1,
      maxMarks: (q as any).maxMarks || 1,
      aiGradingEnabled: (q as any).aiGradingEnabled || q.type === "open_ended",
      answers: (q.answers || []).map((a) => ({
        id: a.id,
        questionId: q.id,
        answer: a.answer,
        isCorrect: a.isCorrect,
      })),
    }));
  }

  // 3. Fetch associated topic
  let topic = null;
  if (quiz.topicId) {
    try {
      const topicResult = await db.select().from(dbTopics).where(eq(dbTopics.id, quiz.topicId));
      if (topicResult.length > 0) {
        topic = topicResult[0];
      }
    } catch {
      // ignore
    }

    if (!topic) {
      topic = INITIAL_TOPICS.find((t) => t.id === quiz.topicId) || null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/dashboard/quizzes" className="hover:text-blue-600 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Practice Quizzes
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {topic && (
              <>
                <span className="text-slate-500">{topic.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold">{quiz.title}</span>
          </div>

          <QuizEngine quiz={quiz as any} questions={questions} topicSlug={topic?.slug || undefined} />
        </main>
      </div>
    </div>
  );
}
