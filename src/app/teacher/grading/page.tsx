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
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <AiGradingReviewPortal initialSubmissions={submissions} role="teacher" />
    </div>
  );
}
