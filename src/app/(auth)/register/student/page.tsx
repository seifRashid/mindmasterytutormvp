import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  User,
  Phone,
  Calendar,
  Users,
  BookOpen,
  UserCheck,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { registerStudentAction } from "@/actions/auth-actions";
import { Navbar } from "@/components/layout/Navbar";
import { INITIAL_CLASSES } from "@/lib/mock-data";
import { db } from "@/db";
import { classes as dbClasses } from "@/db/schema";
import { StudentRegisterForm } from "./StudentRegisterForm";

export default async function RegisterStudentPage() {
  let classesList: any[] = [];
  try {
    classesList = await db.select().from(dbClasses);
  } catch (err) {
    console.error("Failed to fetch classes from database:", err);
  }

  const displayClasses = classesList.length > 0
    ? classesList.map((c) => ({ id: c.id, name: c.name }))
    : INITIAL_CLASSES;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 md:p-8 my-6">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Student Registration</h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
              Complete your profile details below. Newly registered student accounts are reviewed and approved by institution administrators.
            </p>
          </div>

          <StudentRegisterForm classes={displayClasses} registerAction={registerStudentAction} />

          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
            Already registered?{" "}
            <Link href="/login" className="text-cyan-400 font-semibold hover:underline">
              Sign In to Check Status
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
        © 2026 Mind Mastery Tutor Learning Portal
      </footer>
    </div>
  );
}
