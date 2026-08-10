import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/user-store";
import { INITIAL_CLASSES } from "@/lib/mock-data";
import { StudentApprovalsDashboard } from "@/components/admin/StudentApprovalsDashboard";

export default async function TeacherApprovalsPage() {
  const session = await getSession();
  const dbUsers = await getUsers();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Teacher Management
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Student Approvals & Registrations
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Review pending student applications for your classes, verify details, and grant platform access.
            </p>
          </div>

          <StudentApprovalsDashboard
            initialUsers={dbUsers}
            classes={INITIAL_CLASSES}
            role="teacher"
          />
        </main>
      </div>
    </div>
  );
}
