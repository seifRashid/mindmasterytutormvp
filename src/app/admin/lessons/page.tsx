import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  lessons as dbLessons,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
} from "@/db/schema";
import { eq, isNull, isNotNull, and } from "drizzle-orm";
import { toUuid, fromUuid } from "@/lib/id-mapper";
import { purgeExpiredRecycleBin } from "@/actions/teacher-actions";
import { Video, FileText, Paperclip, HelpCircle, Pencil, Plus, Trash2, Library } from "lucide-react";
import Link from "next/link";
import { LessonActionButtons } from "@/components/admin/LessonActionButtons";

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getSession();
  const { view } = await searchParams;
  const isRecycleBin = view === "recycle";

  // 1. Run automatic cleanup of expired recycle bin lessons
  await purgeExpiredRecycleBin();

  // 2. Fetch data from DB
  const allLessons = await db.select().from(dbLessons);
  const activeLessons = allLessons.filter((l) => !l.deletedAt);
  const recycleLessons = allLessons.filter((l) => !!l.deletedAt);

  const displayedLessons = isRecycleBin ? recycleLessons : activeLessons;

  const topicsList = await db.select().from(dbTopics);
  const subjectsList = await db.select().from(dbSubjects);
  const classesList = await db.select().from(dbClasses);

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
            {!isRecycleBin && (
              <Link
                href="/admin/lessons/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all self-start sm:self-center cursor-pointer select-none"
              >
                <Plus className="w-4 h-4" />
                New Lesson
              </Link>
            )}
          </div>

          {/* View Toggles */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm">
            <Link
              href="/admin/lessons"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                !isRecycleBin
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Library className="w-4 h-4" />
              Active Lessons ({activeLessons.length})
            </Link>
            <Link
              href="/admin/lessons?view=recycle"
              className={`pb-3 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                isRecycleBin
                  ? "border-rose-600 text-rose-600 dark:text-rose-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Recycle Bin ({recycleLessons.length})
            </Link>
          </div>

          {/* Legend */}
          {!isRecycleBin && (
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
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {displayedLessons.length === 0 ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Trash2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold">No lessons found</p>
                <p className="text-xs mt-1">
                  {isRecycleBin
                    ? "Lessons soft-deleted will be kept here for 2 days."
                    : "Create your first learning unit to get started!"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Lesson</th>
                    <th className="p-4 hidden md:table-cell">Topic / Subject</th>
                    <th className="p-4 hidden lg:table-cell">{isRecycleBin ? "Deleted At" : "Duration"}</th>
                    <th className="p-4">{isRecycleBin ? "Time Remaining" : "Content"}</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedLessons.map((les) => {
                    const topic = topicsList.find((t) => t.id === les.topicId);
                    const subject = topic ? subjectsList.find((s) => s.id === topic.subjectId) : null;
                    const classLevel = subject ? classesList.find((c) => c.id === subject.classId) : null;

                    // Calculate remaining time in Recycle Bin
                    let hoursLeft = 0;
                    if (isRecycleBin && les.deletedAt) {
                      const ageMs = new Date().getTime() - new Date(les.deletedAt).getTime();
                      hoursLeft = Math.max(0, 48 - Math.floor(ageMs / (1000 * 60 * 60)));
                    }

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
                          {isRecycleBin && les.deletedAt
                            ? new Date(les.deletedAt).toLocaleDateString()
                            : les.duration
                            ? `${Math.floor(les.duration / 60)}m`
                            : "—"}
                        </td>
                        <td className="p-4">
                          {isRecycleBin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold font-mono">
                              ⏰ {hoursLeft}h left
                            </span>
                          ) : (
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
                              {les.lessonQuizId && (
                                <span title="Has inline quiz">
                                  <HelpCircle className="w-4 h-4 text-blue-500" />
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2.5">
                            {isRecycleBin ? (
                              <LessonActionButtons
                                lessonId={les.id}
                                lessonTitle={les.title}
                                mode="recycle"
                                isAdmin={true}
                              />
                            ) : (
                              <>
                                <Link
                                  href={`/admin/lessons/${les.id}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-550/20 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit
                                </Link>
                                <LessonActionButtons
                                  lessonId={les.id}
                                  lessonTitle={les.title}
                                  mode="active"
                                  isAdmin={true}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
