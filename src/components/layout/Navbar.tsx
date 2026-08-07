"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/actions/auth-actions";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
    image?: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "teacher") return "/teacher";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Mind Mastery <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800">Tutor</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Learning Portal</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition-colors hover:text-blue-600 ${
              pathname === "/" ? "text-blue-600 font-semibold" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`transition-colors hover:text-blue-600 ${
              pathname === "/about" ? "text-blue-600 font-semibold" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            About Us
          </Link>
          <Link
            href="/pricing"
            className={`transition-colors hover:text-blue-600 ${
              pathname === "/pricing" ? "text-blue-600 font-semibold" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className={`transition-colors hover:text-blue-600 ${
              pathname === "/contact" ? "text-blue-600 font-semibold" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* User Auth Buttons or Profile Menu */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                  <span className="text-[10px] capitalize px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                    {user.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.email}</p>
                  </div>
                  <Link
                    href={getDashboardHref()}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-500" />
                    Dashboard
                  </Link>
                  {user.role === "student" && (
                    <Link
                      href="/dashboard/progress"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      My Progress
                    </Link>
                  )}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/register/student"
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Join as Student
                </Link>
                <Link
                  href="/register/teacher"
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-all border border-slate-700"
                >
                  Teacher Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle — desktop only */}
        <div className="hidden md:flex items-center">
          <ThemeToggle />
        </div>

        {/* Mobile Menu Toggle - Large touch target */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          style={{ touchAction: "manipulation" }}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          {/* Theme toggle in mobile drawer */}
          <div className="pb-2">
            <ThemeToggle />
          </div>

          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5"
          >
            About Us
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 dark:text-slate-200 py-1.5"
          >
            Pricing
          </Link>
          {user ? (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-500 font-semibold">{user.name} ({user.role})</p>
              <Link
                href={getDashboardHref()}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-blue-600 dark:text-blue-400 py-1"
              >
                Go to Dashboard
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="text-sm font-medium text-rose-600 py-1">
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700"
              >
                Sign In
              </Link>
              <Link
                href="/register/student"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white"
              >
                Join as Student
              </Link>
              <Link
                href="/register/teacher"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white"
              >
                Teacher Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
