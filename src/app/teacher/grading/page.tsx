import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAiGradedSubmissionsAction } from "@/actions/grading-actions";
import { AiGradingReviewPortal } from "@/components/teacher/AiGradingReviewPortal";

export const metadata = {
  title: "AI Grading Review | Teacher Portal",
  description: "Review AI grading results and override grades with full audit trail.",
};

export default async function TeacherGradingPage() {
  const session = await getSession();
  if (!session || (session.role !== "teacher" && session.role !== "admin")) {
    redirect("/login");
  }

  const res = await getAiGradedSubmissionsAction();
  const submissions = res.submissions || [];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <AiGradingReviewPortal initialSubmissions={submissions} role="teacher" />
        </main>
      </div>
    </div>
  );
}
