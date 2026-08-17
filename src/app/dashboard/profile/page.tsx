import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserProfileForm } from "@/components/profile/UserProfileForm";
import { db } from "@/db";
import { classes as dbClasses } from "@/db/schema";

export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const user = await findUserById(session.id);
  if (!user) {
    notFound();
  }

  const dbClassesList = await db.select().from(dbClasses).orderBy(dbClasses.name);
  const classesList = dbClassesList.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="student" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Student Settings
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              My Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Customize your learning profile, guardian contacts, and avatar badge.
            </p>
          </div>

          <UserProfileForm user={user} classes={classesList} />
        </main>
      </div>
    </div>
  );
}
