import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Lock, BookOpen } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonViewer } from "@/components/student/LessonViewer";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { db } from "@/db";
import {
  lessonProgress,
  lessons as dbLessons,
  lessonAttachments as dbAttachments,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
} from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
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

  const { lessonId } = await params;
  const userUuid = toUuid(currentUser.id);
  const lessonUuid = toUuid(lessonId);
  const isStudent = currentUser.role === "student";

  // 1. Fetch lesson details from database
  const lessonResult = await db
    .select()
    .from(dbLessons)
    .where(
      and(
        eq(dbLessons.id, lessonUuid),
        isNull(dbLessons.deletedAt),
        eq(dbLessons.status, "published")
      )
    );

  if (lessonResult.length === 0) {
    notFound();
  }
  const lesson = lessonResult[0];

  // 2. Fetch Topic, Subject, and Class hierarchy
  let topic = null;
  let subject = null;
  let classLevel = null;

  if (lesson.topicId) {
    const topicResult = await db
      .select()
      .from(dbTopics)
      .where(eq(dbTopics.id, lesson.topicId));

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
                Restricted Lesson
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                This lesson belongs to <strong>{classLevel?.name || "another class"}</strong> and is not available to your enrolled class.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/subjects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Return to Your Subjects
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 4. Fetch lesson attachments from database
  const attachmentsList = await db
    .select()
    .from(dbAttachments)
    .where(eq(dbAttachments.lessonId, lessonUuid))
    .orderBy(dbAttachments.orderNumber);

  const fullLesson = {
    ...lesson,
    attachments: attachmentsList.map((a) => ({
      id: a.id,
      lessonId: a.lessonId,
      name: a.name,
      url: a.url,
      type: a.fileType,
      orderNumber: a.orderNumber,
    })),
  };

  // 5. Fetch lesson progress for student
  let progressRecord = null;
  if (userUuid) {
    const records = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userUuid),
          eq(lessonProgress.lessonId, lessonUuid)
        )
      );
    if (records.length > 0) {
      progressRecord = records[0];
    }
  }

  const initialCompleted = progressRecord?.completed ?? false;
  const initialDuration = progressRecord?.watchedDuration ?? 0;
  const initialNotesCompleted = progressRecord?.notesCompleted ?? false;
  const initialVideoCompleted = progressRecord?.videoCompleted ?? false;
  const initialMaterialsCompleted = progressRecord?.materialsCompleted ?? false;

  // 6. Fetch lesson-level inline quiz
  let lessonQuiz = null;
  let lessonQuizQuestions: any[] = [];
  let quizResult = lesson.lessonQuizId
    ? await db
        .select()
        .from(dbQuizzes)
        .where(
          and(
            eq(dbQuizzes.id, lesson.lessonQuizId),
            isNull(dbQuizzes.deletedAt)
          )
        )
    : [];

  // Fallback: check if quiz was linked via lessonId
  if (quizResult.length === 0) {
    quizResult = await db
      .select()
      .from(dbQuizzes)
      .where(
        and(
          eq(dbQuizzes.lessonId, lessonUuid),
          isNull(dbQuizzes.deletedAt)
        )
      );
  }

  if (quizResult.length > 0) {
    lessonQuiz = quizResult[0];
    const questionsList = await db
      .select()
      .from(dbQuestions)
      .where(eq(dbQuestions.quizId, lessonQuiz.id))
      .orderBy(dbQuestions.orderNumber);

    if (questionsList.length > 0) {
      const questionIds = questionsList.map((q) => q.id);
      const answersList = await db
        .select()
        .from(dbAnswers)
        .where(inArray(dbAnswers.questionId, questionIds));

      lessonQuizQuestions = questionsList.map((q) => ({
        ...q,
        answers: answersList.filter((a) => a.questionId === q.id),
      }));
    }
  }

  // 7. Topic-level quiz (for navigation link at the end)
  let topicQuiz = null;
  if (topic) {
    const topicQuizResult = await db
      .select()
      .from(dbQuizzes)
      .where(
        and(
          eq(dbQuizzes.topicId, topic.id),
          isNull(dbQuizzes.lessonId),
          isNull(dbQuizzes.deletedAt)
        )
      );
    if (topicQuizResult.length > 0) {
      topicQuiz = topicQuizResult[0];
    }
  }

  // 8. Sibling lessons for prev/next (only active published lessons)
  let prevLesson = null;
  let nextLesson = null;
  if (topic) {
    const topicLessons = await db
      .select({ id: dbLessons.id, title: dbLessons.title, orderNumber: dbLessons.orderNumber })
      .from(dbLessons)
      .where(
        and(
          eq(dbLessons.topicId, topic.id),
          isNull(dbLessons.deletedAt),
          eq(dbLessons.status, "published")
        )
      )
      .orderBy(dbLessons.orderNumber);

    const currentIndex = topicLessons.findIndex((l) => l.id === lesson.id);
    prevLesson = currentIndex > 0 ? topicLessons[currentIndex - 1] : null;
    nextLesson = currentIndex < topicLessons.length - 1 ? topicLessons[currentIndex + 1] : null;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-5 overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            {classLevel && (
              <>
                <span>{classLevel.name}</span>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            {subject && (
              <>
                <Link
                  href={`/dashboard/subjects/${subject.slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {subject.title}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            {topic && (
              <>
                <span>{topic.title}</span>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">
              {lesson.title}
            </span>
          </div>

          {/* Lesson title */}
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lesson.description}
              </p>
            )}
          </div>

          {/* 4-tab interactive lesson viewer */}
          <LessonViewer
            lesson={fullLesson as any}
            quiz={lessonQuiz as any}
            questions={lessonQuizQuestions}
            prevLessonId={prevLesson?.id}
            nextLessonId={nextLesson?.id}
            topicQuizId={topicQuiz?.id}
            initialCompleted={initialCompleted}
            initialDuration={initialDuration}
            initialNotesCompleted={initialNotesCompleted}
            initialVideoCompleted={initialVideoCompleted}
            initialMaterialsCompleted={initialMaterialsCompleted}
          />
        </main>
      </div>
    </div>
  );
}
