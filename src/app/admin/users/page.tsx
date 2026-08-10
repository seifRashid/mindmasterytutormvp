import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { getUsers } from "@/lib/user-store";
import { Users, Shield, GraduationCap, Sparkles, Trash2 } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await getSession();
  const dbUsers = await getUsers();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="admin" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              System Accounts
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              User Management
            </h1>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dbUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {usr.name.charAt(0)}
                      </div>
                      {usr.name}
                    </td>
                    <td className="p-4 text-slate-500 font-mono">{usr.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                          usr.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                            : usr.role === "teacher"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
                        }`}
                      >
                        {usr.role === "admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : usr.role === "teacher" ? (
                          <Sparkles className="w-3 h-3" />
                        ) : (
                          <GraduationCap className="w-3 h-3" />
                        )}
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
