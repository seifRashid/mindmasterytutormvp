import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, HelpCircle, Lock, BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuizEngine } from "@/components/student/QuizEngine";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
  topics as dbTopics,
  lessons as dbLessons,
  subjects as dbSubjects,
  classes as dbClasses,
} from "@/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
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

  const { quizId } = await params;
  const quizUuid = toUuid(quizId);
  const isStudent = currentUser.role === "student";

  // 1. Fetch active quiz from database
  const quizResult = await db
    .select()
    .from(dbQuizzes)
    .where(
      and(
        eq(dbQuizzes.id, quizUuid),
        isNull(dbQuizzes.deletedAt)
      )
    );

  if (quizResult.length === 0) {
    notFound();
  }
  const quiz = quizResult[0];

  // 2. Trace Quiz to Subject and Class for server-side authorization
  let topic = null;
  let subject = null;
  let classLevel = null;

  if (quiz.topicId) {
    const topicResult = await db
      .select()
      .from(dbTopics)
      .where(eq(dbTopics.id, quiz.topicId));

    if (topicResult.length > 0) {
      topic = topicResult[0];
      if (topic.subjectId) {
        const subjectResult = await db
          .select()
          .from(dbSubjects)
          .where(eq(dbSubjects.id, topic.subjectId));

        if (subjectResult.length > 0) {
          subject = subjectResult[0];
          if (subject.classId) {
            const classResult = await db
              .select()
              .from(dbClasses)
              .where(eq(dbClasses.id, subject.classId));
            if (classResult.length > 0) {
              classLevel = classResult[0];
            }
          }
        }
      }
    }
  } else if (quiz.lessonId) {
    const lessonResult = await db
      .select()
      .from(dbLessons)
      .where(eq(dbLessons.id, quiz.lessonId));

    if (lessonResult.length > 0 && lessonResult[0].topicId) {
      const topicResult = await db
        .select()
        .from(dbTopics)
        .where(eq(dbTopics.id, lessonResult[0].topicId));

      if (topicResult.length > 0) {
        topic = topicResult[0];
        if (topic.subjectId) {
          const subjectResult = await db
            .select()
            .from(dbSubjects)
            .where(eq(dbSubjects.id, topic.subjectId));

          if (subjectResult.length > 0) {
            subject = subjectResult[0];
            if (subject.classId) {
              const classResult = await db
                .select()
                .from(dbClasses)
                .where(eq(dbClasses.id, subject.classId));
              if (classResult.length > 0) {
                classLevel = classResult[0];
              }
            }
          }
        }
      }
    }
  }

  // 3. Enforce Server-Side Class Authorization
  const studentClassUuid = currentUser.classId ? toUuid(currentUser.classId) : null;
  const isAuthorized = !isStudent || !studentClassUuid || !subject?.classId || studentClassUuid === subject.classId;

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
                Restricted Assessment
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This quiz is designated for <strong>{classLevel?.name || "another class"}</strong> and is not available to your enrolled class.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/quizzes"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Return to Your Quizzes
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 4. Fetch quiz questions and answers from DB
  const questionsList = await db
    .select()
    .from(dbQuestions)
    .where(eq(dbQuestions.quizId, quizUuid))
    .orderBy(dbQuestions.orderNumber);

  let formattedQuestions: any[] = [];
  if (questionsList.length > 0) {
    const questionIds = questionsList.map((q) => q.id);
    const answersList = await db
      .select()
      .from(dbAnswers)
      .where(inArray(dbAnswers.questionId, questionIds));

    formattedQuestions = questionsList.map((q) => ({
      id: q.id,
      quizId: q.quizId,
      type: q.type,
      question: q.question,
      explanation: q.explanation,
      orderNumber: q.orderNumber,
      maxMarks: q.maxMarks || 1,
      aiGradingEnabled: q.aiGradingEnabled,
      expectedAnswer: q.expectedAnswer,
      keyConcepts: q.keyConcepts,
      acceptableAnswers: q.acceptableAnswers,
      commonMisconceptions: q.commonMisconceptions,
      gradingRubric: q.gradingRubric,
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/dashboard/quizzes" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              Practice Quizzes
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {subject && (
              <>
                <Link href={`/dashboard/subjects/${subject.slug}`} className="hover:text-blue-600 transition-colors">
                  {subject.title}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            {topic && (
              <>
                <span className="text-slate-500">{topic.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold">{quiz.title}</span>
          </div>

          <QuizEngine
            quiz={quiz as any}
            questions={formattedQuestions}
            topicSlug={topic?.slug || undefined}
          />
        </main>
      </div>
    </div>
  );
}
