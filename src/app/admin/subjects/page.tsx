import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { EditSubjectModal } from "@/components/admin/EditSubjectModal";
import { DeleteSubjectModal } from "@/components/admin/DeleteSubjectModal";
import { getSession } from "@/lib/auth";
import { INITIAL_CLASSES, INITIAL_SUBJECTS } from "@/lib/mock-data";
import { BookOpen } from "lucide-react";

export default async function AdminSubjectsPage() {
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
                Subjects
              </h1>
            </div>
            <CrudModal
              type="subject"
              classes={INITIAL_CLASSES.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Subject Title</th>
                  <th className="p-4">Class Level</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {INITIAL_SUBJECTS.map((sub) => {
                  const parentClass = INITIAL_CLASSES.find((c) => c.id === sub.classId);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        {sub.title}
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{parentClass?.name || "Grade 8"}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate">{sub.description}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-1">
                        <EditSubjectModal
                          subject={{
                            id: sub.id,
                            classId: sub.classId,
                            title: sub.title,
                            description: sub.description || "",
                            icon: sub.icon,
                          }}
                          classes={INITIAL_CLASSES.map((c) => ({ id: c.id, name: c.name }))}
                        />
                        <DeleteSubjectModal subject={sub} />
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
