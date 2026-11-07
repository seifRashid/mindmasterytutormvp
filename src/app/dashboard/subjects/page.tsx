import Link from "next/link";
import { BookOpen, Layers, ArrowRight, Sparkles, CheckCircle2, GraduationCap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  classes as dbClasses,
  subjects as dbSubjects,
  topics as dbTopics,
  lessons as dbLessons,
  lessonProgress as dbProgress,
} from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export const dynamic = "force-dynamic";

export default async function StudentSubjectsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentUser = await findUserById(session.id);
  const status = currentUser?.status || session?.status || "approved";

  if (!currentUser || status === "pending" || status === "rejected") {
    redirect("/pending-approval");
  }

  const userUuid = toUuid(currentUser.id);
  const isStudent = currentUser.role === "student";
  const studentClassUuid = currentUser.classId ? toUuid(currentUser.classId) : null;

  // 1. Fetch classes and subjects from Neon PostgreSQL based on role
  let classesWithSubjects: Array<{
    id: string;
    name: string;
    slug: string;
    subjects: Array<{
      id: string;
      title: string;
      slug: string;
      description: string | null;
      icon: string | null;
      topicsCount: number;
      lessonsCount: number;
      percentCompleted: number;
    }>;
  }> = [];

  try {
    let targetClasses: Array<{ id: string; name: string; slug: string }> = [];

    if (isStudent && studentClassUuid) {
      targetClasses = await db
        .select()
        .from(dbClasses)
        .where(eq(dbClasses.id, studentClassUuid));
    } else {
      // Admin/Teacher preview or student without class: fetch all available classes
      targetClasses = await db.select().from(dbClasses).orderBy(dbClasses.name);
    }

    if (targetClasses.length > 0) {
      const classIds = targetClasses.map((c) => c.id);
      const allSubjects = await db
        .select()
        .from(dbSubjects)
        .where(inArray(dbSubjects.classId, classIds));

      let allTopics: Array<typeof dbTopics.$inferSelect> = [];
      let allLessons: Array<{ id: string; topicId: string }> = [];
      let completedLessonIds = new Set<string>();

      if (allSubjects.length > 0) {
        const subjectIds = allSubjects.map((s) => s.id);
        allTopics = await db
          .select()
          .from(dbTopics)
          .where(inArray(dbTopics.subjectId, subjectIds))
          .orderBy(dbTopics.orderNumber);

        const topicIds = allTopics.map((t) => t.id);

        if (topicIds.length > 0) {
          allLessons = await db
            .select({ id: dbLessons.id, topicId: dbLessons.topicId })
            .from(dbLessons)
            .where(
              and(
                inArray(dbLessons.topicId, topicIds),
                isNull(dbLessons.deletedAt),
                eq(dbLessons.status, "published")
              )
            );

          if (allLessons.length > 0 && isStudent) {
            const lessonIds = allLessons.map((l) => l.id);
            const completedProgress = await db
              .select({ lessonId: dbProgress.lessonId })
              .from(dbProgress)
              .where(
                and(
                  eq(dbProgress.userId, userUuid),
                  eq(dbProgress.completed, true),
                  inArray(dbProgress.lessonId, lessonIds)
                )
              );
            completedLessonIds = new Set(completedProgress.map((p) => p.lessonId));
          }
        }
      }

      // Map hierarchy for all target classes
      classesWithSubjects = targetClasses.map((cls) => {
        const subjectsForClass = allSubjects
          .filter((s) => s.classId === cls.id)
          .map((sub) => {
            const subTopics = allTopics.filter((t) => t.subjectId === sub.id);
            const subTopicIds = subTopics.map((t) => t.id);
            const subLessons = allLessons.filter((l) => subTopicIds.includes(l.topicId));

            let percentCompleted = 0;
            if (subLessons.length > 0) {
              const finishedCount = subLessons.filter((l) => completedLessonIds.has(l.id)).length;
              percentCompleted = Math.round((finishedCount / subLessons.length) * 100);
            }

            return {
              id: sub.id,
              title: sub.title,
              slug: sub.slug,
              description: sub.description,
              icon: sub.icon,
              topicsCount: subTopics.length,
              lessonsCount: subLessons.length,
              percentCompleted,
            };
          });

        return {
          id: cls.id,
          name: cls.name,
          slug: cls.slug,
          subjects: subjectsForClass,
        };
      });
    }
  } catch (err) {
    console.error("Failed to load subjects from database:", err);
  }

  const assignedClassName = classesWithSubjects[0]?.name;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Curriculum Catalog
                </span>
                {assignedClassName && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Enrolled: {assignedClassName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Your Enrolled Subjects
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Select a subject below to explore structured topic progressions, lessons, and interactive assessments.
              </p>
            </div>
          </div>

          {/* Database-Driven Classes & Subjects Display */}
          {classesWithSubjects.length > 0 ? (
            <div className="space-y-10">
              {classesWithSubjects.map((cls) => (
                <div key={cls.id} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {cls.name}
                      </h2>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      {cls.subjects.length} {cls.subjects.length === 1 ? "Subject" : "Subjects"}
                    </span>
                  </div>

                  {cls.subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cls.subjects.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/dashboard/subjects/${sub.slug}`}
                          className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-500/50 transition-all space-y-4 group flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                                <BookOpen className="w-6 h-6" />
                              </div>
                              {sub.percentCompleted > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {sub.percentCompleted}% Done
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {sub.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                              {sub.description || "Explore comprehensive lessons, rich notes, and interactive quizzes for this subject."}
                            </p>
                          </div>

                          {/* Progress bar if student has progress */}
                          {sub.percentCompleted > 0 && (
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${sub.percentCompleted}%` }}
                              />
                            </div>
                          )}

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-400">
                              {sub.topicsCount} {sub.topicsCount === 1 ? "Topic" : "Topics"} · {sub.lessonsCount} {sub.lessonsCount === 1 ? "Lesson" : "Lessons"}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Explore Roadmap <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No subjects have been added to this class yet.
                      </p>
                      <p className="text-xs text-slate-400">
                        Your teacher or administrator will publish curriculum subjects soon.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <GraduationCap className="w-12 h-12 text-blue-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Enrolled Class Assigned
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your student profile does not have an assigned grade or class yet. Please contact your school administrator or update your class selection in your profile settings.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard/profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Go to Profile Settings
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
