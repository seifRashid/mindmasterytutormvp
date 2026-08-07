import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { getSession } from "@/lib/auth";
import { INITIAL_LESSONS, INITIAL_TOPICS } from "@/lib/mock-data";
import { Video, Trash2 } from "lucide-react";

export default async function TeacherLessonsPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Teacher Management
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                My Video Lessons
              </h1>
            </div>
            <CrudModal
              type="lesson"
              topics={INITIAL_TOPICS.map((t) => ({ id: t.id, title: t.title }))}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Lesson Title</th>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {INITIAL_LESSONS.map((les) => {
                  const parentTopic = INITIAL_TOPICS.find((t) => t.id === les.topicId);
                  return (
                    <tr key={les.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-emerald-500" />
                        {les.title}
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{parentTopic?.title || "Topic"}</td>
                      <td className="p-4 text-slate-500 font-mono">{Math.floor(les.duration / 60)} mins</td>
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
