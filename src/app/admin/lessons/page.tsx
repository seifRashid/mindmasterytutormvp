import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { INITIAL_LESSONS, INITIAL_TOPICS, INITIAL_SUBJECTS, INITIAL_CLASSES } from "@/lib/mock-data";
import { Video, FileText, Paperclip, HelpCircle, Pencil, Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminLessonsPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Content Management
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                Lessons
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Manage lesson notes, videos, materials, and quizzes from the lesson builder.
              </p>
            </div>
            <Link
              href="/admin/lessons/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              New Lesson
            </Link>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: FileText, label: "Has Notes", color: "text-indigo-500" },
              { icon: Video, label: "Has Video", color: "text-emerald-500" },
              { icon: Paperclip, label: "Has Materials", color: "text-amber-500" },
              { icon: HelpCircle, label: "Has Inline Quiz", color: "text-blue-500" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Lesson</th>
                  <th className="p-4 hidden md:table-cell">Topic / Subject</th>
                  <th className="p-4 hidden lg:table-cell">Duration</th>
                  <th className="p-4">Content</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {INITIAL_LESSONS.map((les) => {
                  const topic = INITIAL_TOPICS.find((t) => t.id === les.topicId);
                  const subject = topic ? INITIAL_SUBJECTS.find((s) => s.id === topic.subjectId) : null;
                  const classLevel = subject ? INITIAL_CLASSES.find((c) => c.id === subject.classId) : null;

                  return (
                    <tr key={les.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                          {les.title}
                        </p>
                        <p className="text-slate-500 mt-0.5 line-clamp-1">{les.description}</p>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{topic?.title ?? "—"}</p>
                        <p className="text-slate-400">{classLevel?.name} · {subject?.title}</p>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-slate-500 font-mono">
                        {les.duration ? `${Math.floor(les.duration / 60)}m` : "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {les.richContent && (
                            <span title="Has lesson notes">
                              <FileText className="w-4 h-4 text-indigo-500" />
                            </span>
                          )}
                          {les.videoUrl && (
                            <span title="Has video">
                              <Video className="w-4 h-4 text-emerald-500" />
                            </span>
                          )}
                          {les.attachments && les.attachments.length > 0 && (
                            <span title={`${les.attachments.length} material(s)`}>
                              <Paperclip className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                          {les.lessonQuizId && (
                            <span title="Has inline quiz">
                              <HelpCircle className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/lessons/${les.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Link>
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
