import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { DeleteQuizModal } from "@/components/admin/DeleteQuizModal";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  topics as dbTopics,
  subjects as dbSubjects,
} from "@/db/schema";
import { HelpCircle, Plus, Edit2 } from "lucide-react";
import Link from "next/link";

export default async function AdminQuizzesPage() {
  const session = await getSession();

  // 1. Fetch live quizzes, topics, subjects, and questions from database
  const quizzesList = await db.select().from(dbQuizzes);
  const topicsList = await db.select().from(dbTopics);
  const subjectsList = await db.select().from(dbSubjects);
  const questionsList = await db.select().from(dbQuestions);

  // Group question counts by quizId
  const questionCountMap: Record<string, number> = {};
  for (const q of questionsList) {
    questionCountMap[q.quizId] = (questionCountMap[q.quizId] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Management Table
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Quizzes & Questions
              </h1>
            </div>

            {/* Dedicated Page Link for Creating a Quiz */}
            <Link
              href="/admin/quizzes/new"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Quiz
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Quiz Title</th>
                  <th className="p-4">Parent Topic</th>
                  <th className="p-4">Passing Score</th>
                  <th className="p-4">Question Count</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizzesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No quizzes created yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Click &ldquo;Create New Quiz&rdquo; above to build and publish your first quiz.
                      </p>
                    </td>
                  </tr>
                ) : (
                  quizzesList.map((quiz) => {
                    const parentTopic = topicsList.find((t) => t.id === quiz.topicId);
                    const parentSubject = parentTopic
                      ? subjectsList.find((s) => s.id === parentTopic.subjectId)
                      : null;
                    const questionCount = questionCountMap[quiz.id] || 0;

                    return (
                      <tr
                        key={quiz.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors duration-150 group"
                      >
                        <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span>{quiz.title}</span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                          {parentTopic ? (
                            <span>
                              {parentTopic.title}{" "}
                              {parentSubject && (
                                <span className="text-[10px] text-slate-400">({parentSubject.title})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No topic</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-bold">
                          {quiz.passingScore}%
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">
                          {questionCount} Qs
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/quizzes/${quiz.id}`}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center justify-center transition-colors"
                            title="Edit Quiz & Questions"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <DeleteQuizModal quiz={{ id: quiz.id, title: quiz.title }} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
