import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonBuilder } from "@/components/admin/LessonBuilder";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { topics as dbTopics } from "@/db/schema";
import { toUuid } from "@/lib/id-mapper";

export default async function TeacherNewLessonPage() {
  const session = await getSession();

  const allTopicsList = await db.select().from(dbTopics).orderBy(dbTopics.orderNumber);
  const topicOptions = allTopicsList.map((t) => ({ id: t.id, title: t.title }));

  const newLessonId = crypto.randomUUID();

  const newLesson = {
    id: newLessonId,
    topicId: allTopicsList[0]?.id || "",
    title: "New Lesson",
    description: "Enter a brief summary for this lesson.",
    richContent: "<h2>Lesson Title</h2><p>Start writing notes here...</p>",
    videoUrl: "",
    duration: 600,
    orderNumber: 1,
    status: "published" as const,
    attachments: [],
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link href="/teacher/lessons" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Lessons
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold">
              New Lesson
            </span>
          </div>

          {/* Lesson Builder */}
          <LessonBuilder
            lesson={newLesson as any}
            topics={topicOptions}
          />
        </main>
      </div>
    </div>
  );
}
