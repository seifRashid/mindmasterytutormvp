import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonBuilder } from "@/components/admin/LessonBuilder";
import { getSession } from "@/lib/auth";
import {
  INITIAL_LESSONS,
  INITIAL_QUIZZES,
  INITIAL_QUESTIONS,
  INITIAL_TOPICS,
  INITIAL_SUBJECTS,
  INITIAL_CLASSES,
} from "@/lib/mock-data";

export default async function AdminLessonBuilderPage({
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

  const quiz = INITIAL_QUIZZES.find((q) => q.id === lesson.lessonQuizId);
  const questions = quiz ? INITIAL_QUESTIONS.filter((q) => q.quizId === quiz.id) : [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link href="/admin/lessons" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Lessons
            </Link>
            {classLevel && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{classLevel.name}</span>
              </>
            )}
            {subject && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{subject.title}</span>
              </>
            )}
            {topic && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{topic.title}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">
              {lesson.title}
            </span>
          </div>

          {/* Lesson Builder */}
          <LessonBuilder
            lesson={lesson}
            quiz={quiz}
            questions={questions}
          />
        </main>
      </div>
    </div>
  );
}
