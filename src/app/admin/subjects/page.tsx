import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { CrudModal } from "@/components/admin/CrudModal";
import { SubjectsListManager } from "@/components/admin/SubjectsListManager";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { classes as dbClasses, subjects as dbSubjects } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminSubjectsPage() {
  const session = await getSession();

  const dbClassesList = await db.select().from(dbClasses).orderBy(dbClasses.name);
  const classesList = dbClassesList.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const dbSubjectsList = await db.select().from(dbSubjects).orderBy(desc(dbSubjects.createdAt));
  const subjectsList = dbSubjectsList.map((sub) => ({
    id: sub.id,
    classId: sub.classId,
    title: sub.title,
    slug: sub.slug,
    description: sub.description || "",
    icon: sub.icon || "BookOpen",
    createdAt: sub.createdAt.toISOString(),
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
                Subjects
              </h1>
            </div>
            <CrudModal
              type="subject"
              classes={classesList}
            />
          </div>

          <SubjectsListManager
            subjects={subjectsList}
            classes={classesList}
          />
        </main>
      </div>
    </div>
  );
}

