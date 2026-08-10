"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Video,
  HelpCircle,
  TrendingUp,
  Users,
  Layers,
  GraduationCap,
  Sparkles,
  X,
  Menu,
} from "lucide-react";

interface SidebarProps {
  role: "student" | "teacher" | "admin";
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scroll on body when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const studentLinks = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Subjects", href: "/dashboard/subjects", icon: BookOpen },
    { label: "Learning Progress", href: "/dashboard/progress", icon: TrendingUp },
  ];

  const adminLinks = [
    { label: "Admin Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Student Approvals", href: "/admin/approvals", icon: Users },
    { label: "Classes", href: "/admin/classes", icon: Layers },
    { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { label: "Topics", href: "/admin/topics", icon: FolderTree },
    { label: "Video Lessons", href: "/admin/lessons", icon: Video },
    { label: "Quizzes", href: "/admin/quizzes", icon: HelpCircle },
    { label: "User Accounts", href: "/admin/users", icon: Users },
  ];

  const teacherLinks = [
    { label: "Teacher Portal", href: "/teacher", icon: LayoutDashboard },
    { label: "Student Approvals", href: "/teacher/approvals", icon: Users },
    { label: "Manage Lessons", href: "/teacher/lessons", icon: Video },
    { label: "Manage Quizzes", href: "/teacher/quizzes", icon: HelpCircle },
  ];

  const links =
    role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : studentLinks;

  const SidebarContent = () => (
    <div className="h-full flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Role Badge Header */}
        <div className="px-3 py-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            {role === "admin" ? <Layers className="w-4 h-4" /> : role === "teacher" ? <Sparkles className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
              {role} Portal
            </p>
            <p className="text-[10px] text-slate-500">Mind Mastery Tutor</p>
          </div>
        </div>

        {/* Navigation Group */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Menu
          </p>
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Helpful Footer Widget */}
      <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40">
        <p className="text-xs font-semibold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Need Assistance?
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
          Browse course guides for step-by-step help.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button — shown inside the page layout */}
      <button
        onTouchStart={(e) => { e.stopPropagation(); }}
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 left-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        aria-label="Open sidebar menu"
        style={{ touchAction: "manipulation" }}
      >
        <Menu className="w-6 h-6" />
      </button>


      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside
        className={`
          md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Navigation</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar — always visible on md+ screens */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 min-h-[calc(100vh-4rem)] flex-col justify-between">
        <SidebarContent />
      </aside>
    </>
  );
}
