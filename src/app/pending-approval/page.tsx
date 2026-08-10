import Link from "next/link";
import { getSession } from "@/lib/auth";
import { findUserById } from "@/lib/user-store";
import { Navbar } from "@/components/layout/Navbar";
import {
  Clock,
  XCircle,
  CheckCircle2,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  BookOpen,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { INITIAL_CLASSES } from "@/lib/mock-data";

export default async function PendingApprovalPage() {
  const session = await getSession();

  // Find user details from database
  const user = session ? await findUserById(session.id) : null;
  const status = user?.status || session?.status || "pending";
  const userClass = INITIAL_CLASSES.find((c) => c.id === user?.classId);

  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar user={session} />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 my-8">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6 text-center">
          
          {/* Status Badge & Icon */}
          {isApproved ? (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Account Approved 🎉
              </span>
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.name || session?.name}!</h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto">
                Your student account has been approved by the institution. You now have full access to your learning materials.
              </p>
              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <GraduationCap className="w-4 h-4" />
                  Go to Student Dashboard
                </Link>
              </div>
            </div>
          ) : isRejected ? (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                Application Rejected
              </span>
              <h1 className="text-2xl font-bold text-white">Registration Status</h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto">
                Your registration application was reviewed and could not be approved at this time.
              </p>
              
              {user?.rejectionReason && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-left text-xs space-y-1">
                  <p className="font-bold text-rose-400">Rejection Reason:</p>
                  <p className="text-rose-200/90 leading-relaxed">{user.rejectionReason}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Pending Administrator Approval
              </span>
              <h1 className="text-2xl font-bold text-white">Application Under Review</h1>
              <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Thank you for registering, <strong className="text-white">{user?.name || session?.name}</strong>! Your application is currently queued for review by institution staff.
              </p>
            </div>
          )}

          {/* Submitted Summary Box */}
          {user && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-3">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Registration Details Submitted
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span><strong>Grade:</strong> {userClass?.name || "Not assigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="truncate"><strong>Email:</strong> {user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span><strong>Phone:</strong> {user.phone}</span>
                  </div>
                )}
                {user.parentName && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span><strong>Parent:</strong> {user.parentName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
            <Link
              href="/pending-approval"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check Status Again
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </form>
          </div>

        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
