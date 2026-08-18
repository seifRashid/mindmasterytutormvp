import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { EditClassModal } from "@/components/admin/EditClassModal";
import { DeleteClassModal } from "@/components/admin/DeleteClassModal";
import { getSession } from "@/lib/auth";
import { Layers } from "lucide-react";
import { db } from "@/db";
import { classes as dbClasses } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminClassesPage() {
  const session = await getSession();

  const dbClassesList = await db.select().from(dbClasses).orderBy(desc(dbClasses.createdAt));
  const classesList = dbClassesList.map((cls) => ({
    id: cls.id,
    name: cls.name,
    slug: cls.slug,
    createdAt: cls.createdAt.toISOString(),
  }));

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
                Class Levels
              </h1>
            </div>
            <CrudModal type="class" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">Class Level Name</th>
                  <th className="p-4">Slug Identifier</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {classesList.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      {cls.name}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{cls.slug}</td>
                    <td className="p-4 text-slate-500">{new Date(cls.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-1">
                      <EditClassModal classLevel={cls} />
                      <DeleteClassModal classLevel={cls} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
