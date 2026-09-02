import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuizBuilder } from "@/components/admin/QuizBuilder";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { topics as dbTopics, subjects as dbSubjects, classes as dbClasses } from "@/db/schema";
import { redirect } from "next/navigation";

export default async function AdminNewQuizPage() {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    redirect("/login");
  }

  // Fetch topics with subject and class information for clean dropdown options
  const allTopics = await db.select().from(dbTopics).orderBy(dbTopics.orderNumber);
  const allSubjects = await db.select().from(dbSubjects);
  const allClasses = await db.select().from(dbClasses);

  const topicOptions = allTopics.map((t) => {
    const sub = allSubjects.find((s) => s.id === t.subjectId);
    const cls = sub ? allClasses.find((c) => c.id === sub.classId) : null;
    return {
      id: t.id,
      title: t.title,
      subjectTitle: sub ? `${sub.title}${cls ? ` - ${cls.name}` : ""}` : undefined,
    };
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <QuizBuilder
            role="admin"
            topics={topicOptions}
            isEditing={false}
          />
        </main>
      </div>
    </div>
  );
}
