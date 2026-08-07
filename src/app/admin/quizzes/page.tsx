import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { getSession } from "@/lib/auth";
import { INITIAL_QUESTIONS, INITIAL_QUIZZES, INITIAL_TOPICS } from "@/lib/mock-data";
import { HelpCircle, Trash2 } from "lucide-react";

export default async function AdminQuizzesPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Management Table
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Quizzes & Questions
              </h1>
            </div>
            <CrudModal
              type="quiz"
              topics={INITIAL_TOPICS.map((t) => ({ id: t.id, title: t.title }))}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                {INITIAL_QUIZZES.map((quiz) => {
                  const parentTopic = INITIAL_TOPICS.find((t) => t.id === quiz.topicId);
                  const questions = INITIAL_QUESTIONS.filter((q) => q.quizId === quiz.id);

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        {quiz.title}
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{parentTopic?.title || "Topic"}</td>
                      <td className="p-4 text-slate-500 font-bold">{quiz.passingScore}%</td>
                      <td className="p-4 text-slate-500 font-mono">{questions.length} Qs</td>
                      <td className="p-4 text-right">
                        <button className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
