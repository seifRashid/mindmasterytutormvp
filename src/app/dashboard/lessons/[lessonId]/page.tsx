import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonViewer } from "@/components/student/LessonViewer";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  lessonProgress,
  lessons as dbLessons,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
} from "@/db/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await getSession();
  const { lessonId } = await params;

  const userUuid = session ? toUuid(session.id) : null;
  const lessonUuid = toUuid(lessonId);

  // Fetch lesson details from database
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
  if (lessonResult.length === 0) notFound();
  const lesson = lessonResult[0];

  let progressRecord = null;
  if (userUuid) {
    const records = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userUuid), eq(lessonProgress.lessonId, lessonUuid)));
    if (records.length > 0) {
      progressRecord = records[0];
    }
  }

  const initialCompleted = progressRecord?.completed ?? false;
  const initialDuration = progressRecord?.watchedDuration ?? 0;
  const initialNotesCompleted = progressRecord?.notesCompleted ?? false;
  const initialVideoCompleted = progressRecord?.videoCompleted ?? false;
  const initialMaterialsCompleted = progressRecord?.materialsCompleted ?? false;

  // Fetch topic, subject, and class level from DB
  let topic = null;
  let subject = null;
  let classLevel = null;
  if (lesson.topicId) {
    const topicResult = await db.select().from(dbTopics).where(eq(dbTopics.id, lesson.topicId));
    if (topicResult.length > 0) {
      topic = topicResult[0];
      if (topic.subjectId) {
        const subjectResult = await db.select().from(dbSubjects).where(eq(dbSubjects.id, topic.subjectId));
        if (subjectResult.length > 0) {
          subject = subjectResult[0];
          if (subject.classId) {
            const classResult = await db.select().from(dbClasses).where(eq(dbClasses.id, subject.classId));
            if (classResult.length > 0) {
              classLevel = classResult[0];
            }
          }
        }
      }
    }
  }

  // Fetch lesson-level inline quiz
  let lessonQuiz = null;
  let lessonQuizQuestions: any[] = [];
  if (lesson.lessonQuizId) {
    const quizResult = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, lesson.lessonQuizId));
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
  }

  // Topic-level quiz (for navigation link at the end)
  let topicQuiz = null;
  if (topic) {
    const topicQuizResult = await db
      .select()
      .from(dbQuizzes)
      .where(and(eq(dbQuizzes.topicId, topic.id), isNull(dbQuizzes.lessonId)));
    if (topicQuizResult.length > 0) {
      topicQuiz = topicQuizResult[0];
    }
  }

  // Sibling lessons for prev/next
  let prevLesson = null;
  let nextLesson = null;
  if (topic) {
    const topicLessons = await db
      .select()
      .from(dbLessons)
      .where(and(eq(dbLessons.topicId, topic.id), isNull(dbLessons.deletedAt)))
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
                <Link href={`/dashboard/subjects/${subject.slug}`} className="hover:text-blue-600 transition-colors">
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
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{lesson.description}</p>
            )}
          </div>

          {/* 4-tab lesson viewer */}
          <LessonViewer
            lesson={lesson as any}
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
