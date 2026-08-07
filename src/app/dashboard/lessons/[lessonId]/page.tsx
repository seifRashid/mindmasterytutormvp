import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Video } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { VideoPlayer } from "@/components/student/VideoPlayer";
import { getSession } from "@/lib/auth";
import {
  INITIAL_LESSONS,
  INITIAL_QUIZZES,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
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
  const topicLessons = INITIAL_LESSONS.filter((l) => l.topicId === lesson.topicId);
  const quiz = INITIAL_QUIZZES.find((q) => q.topicId === lesson.topicId);

  const currentIndex = topicLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? topicLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < topicLessons.length - 1 ? topicLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            {subject && (
              <>
                <Link href={`/dashboard/subjects/${subject.slug}`} className="hover:text-blue-600">
                  {subject.title}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-slate-900 dark:text-white font-bold">{lesson.title}</span>
          </div>

          {/* Interactive Video Player Component */}
          <VideoPlayer
            lesson={lesson}
            prevLessonId={prevLesson?.id}
            nextLessonId={nextLesson?.id}
            nextQuizId={quiz?.id}
            initialCompleted={false}
            initialDuration={0}
          />
        </main>
      </div>
    </div>
  );
}
