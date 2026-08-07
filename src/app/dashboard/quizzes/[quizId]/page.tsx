import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuizEngine } from "@/components/student/QuizEngine";
import { getSession } from "@/lib/auth";
import { INITIAL_QUESTIONS, INITIAL_QUIZZES, INITIAL_TOPICS } from "@/lib/mock-data";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await getSession();
  const { quizId } = await params;

  const quiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
  if (!quiz) notFound();

  const questions = INITIAL_QUESTIONS.filter((q) => q.quizId === quiz.id);
  const topic = INITIAL_TOPICS.find((t) => t.id === quiz.topicId);

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

          <QuizEngine quiz={quiz} questions={questions} topicSlug={topic?.slug} />
        </main>
      </div>
    </div>
  );
}
