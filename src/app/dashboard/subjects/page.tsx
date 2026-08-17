import Link from "next/link";
import { BookOpen, Layers, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { INITIAL_CLASSES, INITIAL_SUBJECTS, INITIAL_TOPICS } from "@/lib/mock-data";

export default async function StudentSubjectsPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-8 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Curriculum Catalog
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Browse Classes & Subjects
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Select a subject below to view topic progressions, lessons, and interactive quizzes.
            </p>
          </div>

          {/* Classes & Subjects Grouped */}
          <div className="space-y-8">
            {INITIAL_CLASSES.map((cls) => {
              const classSubjects = INITIAL_SUBJECTS.filter((s) => s.classId === cls.id);
              return (
                <div key={cls.id} className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {cls.name}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      {classSubjects.length} Subjects
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classSubjects.map((sub) => {
                      const subTopics = INITIAL_TOPICS.filter((t) => t.subjectId === sub.id);
                      return (
                        <Link
                          key={sub.id}
                          href={`/dashboard/subjects/${sub.slug}`}
                          className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-500/50 transition-all space-y-4 group flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                              {sub.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                              {sub.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-400">{subTopics.length} Topics Unlocked</span>
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Explore Roadmap <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
