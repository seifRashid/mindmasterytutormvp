import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserProfileForm } from "@/components/profile/UserProfileForm";

export default async function TeacherProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    redirect("/login");
  }

  const user = await findUserById(session.id);
  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Instructor Settings
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              My Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your teacher workspace details, sign-in password, and user avatar.
            </p>
          </div>

          <UserProfileForm user={user} />
        </main>
      </div>
    </div>
  );
}
