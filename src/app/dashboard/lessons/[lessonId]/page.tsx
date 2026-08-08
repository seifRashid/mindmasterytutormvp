import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonViewer } from "@/components/student/LessonViewer";
import { getSession } from "@/lib/auth";
import {
  INITIAL_LESSONS,
  INITIAL_QUIZZES,
  INITIAL_QUESTIONS,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
  INITIAL_CLASSES,
} from "@/lib/mock-data";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await getSession();
  const { lessonId } = await params;

  const lesson = INITIAL_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const topic = INITIAL_TOPICS.find((t) => t.id === lesson.topicId);
  const subject = topic ? INITIAL_SUBJECTS.find((s) => s.id === topic.subjectId) : null;
  const classLevel = subject ? INITIAL_CLASSES.find((c) => c.id === subject.classId) : null;

  // Lesson-level inline quiz
  const lessonQuiz = lesson.lessonQuizId
    ? INITIAL_QUIZZES.find((q) => q.id === lesson.lessonQuizId) ?? null
    : null;
  const lessonQuizQuestions = lessonQuiz
    ? INITIAL_QUESTIONS.filter((q) => q.quizId === lessonQuiz.id)
    : [];

  // Topic-level quiz (for navigation link at the end)
  const topicQuiz = topic
    ? INITIAL_QUIZZES.find((q) => q.topicId === topic.id) ?? null
    : null;

  // Sibling lessons for prev/next
  const topicLessons = INITIAL_LESSONS.filter((l) => l.topicId === lesson.topicId)
    .sort((a, b) => a.orderNumber - b.orderNumber);
  const currentIndex = topicLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? topicLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < topicLessons.length - 1 ? topicLessons[currentIndex + 1] : null;

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
            lesson={lesson}
            quiz={lessonQuiz}
            questions={lessonQuizQuestions}
            prevLessonId={prevLesson?.id}
            nextLessonId={nextLesson?.id}
            topicQuizId={topicQuiz?.id}
            initialCompleted={false}
          />
        </main>
      </div>
    </div>
  );
}
