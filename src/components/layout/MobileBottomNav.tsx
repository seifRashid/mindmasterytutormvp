"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HelpCircle,
  BookOpen,
  TrendingUp,
  User,
  Video,
  Brain,
  Users,
  Layers,
  Menu,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  isAction?: boolean;
}

interface MobileBottomNavProps {
  role: "student" | "teacher" | "admin";
  onOpenMoreDrawer?: () => void;
}

export function MobileBottomNav({ role, onOpenMoreDrawer }: MobileBottomNavProps) {
  const pathname = usePathname();

  // Student Navigation Items
  const studentTabs: NavItem[] = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    { label: "Quizzes", href: "/dashboard/quizzes", icon: HelpCircle, exact: false },
    { label: "Subjects", href: "/dashboard/subjects", icon: BookOpen, exact: false },
    { label: "Progress", href: "/dashboard/progress", icon: TrendingUp, exact: false },
    { label: "Profile", href: "/dashboard/profile", icon: User, exact: false },
  ];

  // Teacher Navigation Items
  const teacherTabs: NavItem[] = [
    { label: "Overview", href: "/teacher", icon: LayoutDashboard, exact: true },
    { label: "Lessons", href: "/teacher/lessons", icon: Video, exact: false },
    { label: "Quizzes", href: "/teacher/quizzes", icon: HelpCircle, exact: false },
    { label: "Grading", href: "/teacher/grading", icon: Brain, exact: false },
    { label: "More", href: "#more", icon: Menu, isAction: true },
  ];

  // Admin Navigation Items
  const adminTabs: NavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Approvals", href: "/admin/approvals", icon: Users, exact: false },
    { label: "Grading", href: "/admin/grading", icon: Brain, exact: false },
    { label: "Users", href: "/admin/users", icon: Layers, exact: false },
    { label: "More", href: "#more", icon: Menu, isAction: true },
  ];

  const tabs: NavItem[] = role === "admin" ? adminTabs : role === "teacher" ? teacherTabs : studentTabs;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-16 items-center justify-around px-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.isAction) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={onOpenMoreDrawer}
                className="flex flex-col items-center justify-center h-full py-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-90 transition-all select-none touch-manipulation cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium leading-none tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          }

          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center h-full py-1 transition-all select-none touch-manipulation active:scale-90 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/70 shadow-sm"
                    : "bg-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] leading-none tracking-tight mt-0.5 ${
                  isActive ? "font-bold" : "font-medium"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
