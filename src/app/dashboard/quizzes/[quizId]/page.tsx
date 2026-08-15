import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await getSession();
  const { quizId } = await params;

  const quizUuid = toUuid(quizId);

  // Fetch quiz details from database
  const quizResult = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizUuid));
  if (quizResult.length === 0) notFound();
  const quiz = quizResult[0];

  // Fetch quiz questions
  const questionsList = await db
    .select()
    .from(dbQuestions)
    .where(eq(dbQuestions.quizId, quizUuid))
    .orderBy(dbQuestions.orderNumber);

  let questions: any[] = [];
  if (questionsList.length > 0) {
    const questionIds = questionsList.map((q) => q.id);
    const answersList = await db
      .select()
      .from(dbAnswers)
      .where(inArray(dbAnswers.questionId, questionIds));

    questions = questionsList.map((q) => ({
      ...q,
      answers: answersList.filter((a) => a.questionId === q.id),
    }));
  }

  // Fetch associated topic
  let topic = null;
  if (quiz.topicId) {
    const topicResult = await db.select().from(dbTopics).where(eq(dbTopics.id, quiz.topicId));
    if (topicResult.length > 0) {
      topic = topicResult[0];
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
