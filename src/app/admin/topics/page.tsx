import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { subjects as dbSubjects, topics as dbTopics, classes as dbClasses } from "@/db/schema";
import { asc } from "drizzle-orm";
import { TopicsListManager } from "@/components/admin/TopicsListManager";

export default async function AdminTopicsPage() {
  const session = await getSession();

  const dbClassesList = await db.select().from(dbClasses).orderBy(dbClasses.name);
  const classesList = dbClassesList.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const dbSubjectsList = await db.select().from(dbSubjects).orderBy(dbSubjects.title);
  const subjectsList = dbSubjectsList.map((s) => ({
    id: s.id,
    classId: s.classId,
    title: s.title,
  }));

  const dbTopicsList = await db.select().from(dbTopics).orderBy(asc(dbTopics.orderNumber));
  const topicsList = dbTopicsList.map((top) => ({
    id: top.id,
    subjectId: top.subjectId,
    title: top.title,
    description: top.description || "",
    orderNumber: top.orderNumber,
    createdAt: top.createdAt.toISOString(),
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
                Topics
              </h1>
            </div>
          </div>

          <TopicsListManager
            topics={topicsList}
            subjects={subjectsList}
            classes={classesList}
          />
        </main>
      </div>
    </div>
  );
}
