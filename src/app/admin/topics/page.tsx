import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { EditTopicModal } from "@/components/admin/EditTopicModal";
import { DeleteTopicModal } from "@/components/admin/DeleteTopicModal";
import { getSession } from "@/lib/auth";
import { INITIAL_SUBJECTS, INITIAL_TOPICS } from "@/lib/mock-data";
import { FolderTree } from "lucide-react";

export default async function AdminTopicsPage() {
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
                Topics
              </h1>
            </div>
            <CrudModal
              type="topic"
              subjects={INITIAL_SUBJECTS.map((s) => ({ id: s.id, title: s.title }))}
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Topic Title</th>
                  <th className="p-4">Parent Subject</th>
                  <th className="p-4">Order Number</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {INITIAL_TOPICS.map((top) => {
                  const parentSub = INITIAL_SUBJECTS.find((s) => s.id === top.subjectId);
                  return (
                    <tr key={top.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-cyan-500" />
                        {top.title}
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{parentSub?.title || "Math"}</td>
                      <td className="p-4 text-slate-500 font-mono"># {top.orderNumber}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-1">
                        <EditTopicModal
                          topic={{
                            id: top.id,
                            subjectId: top.subjectId,
                            title: top.title,
                            description: top.description || "",
                            orderNumber: top.orderNumber,
                          }}
                          subjects={INITIAL_SUBJECTS.map((s) => ({ id: s.id, title: s.title }))}
                        />
                        <DeleteTopicModal topic={top} />
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
