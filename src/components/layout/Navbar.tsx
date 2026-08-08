"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  GraduationCap,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Bell,
  User as UserIcon,
  Menu,
  X,
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
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    if (user.role === "teacher") return "/teacher";
    return "/dashboard";
  };

  // Nav links — when logged in, show Dashboard first
  const navLinks = [
    ...(user ? [{ label: "Dashboard", href: getDashboardHref() }] : []),
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* ── LEFT: Brand pill ─────────────────────────────────────── */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight whitespace-nowrap">
            Mind Mastery
          </span>
        </Link>

        {/* ── CENTER: Pill nav links (desktop) ─────────────────────── */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-1 py-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── RIGHT: Icon strip ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Theme toggle */}
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>

          {user ? (
            <>
              {/* Notification bell */}
              <button
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                aria-label="Notifications"
                style={{ touchAction: "manipulation" }}
              >
                <Bell className="w-4.5 h-4.5" />
                {/* Dot indicator */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white dark:border-slate-950" />
              </button>

              {/* Avatar + dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ touchAction: "manipulation" }}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  aria-label="Profile menu"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold capitalize">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={getDashboardHref()}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-500" />
                      Dashboard
                    </Link>

                    {user.role === "student" && (
                      <Link
                        href="/dashboard/progress"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        My Progress
                      </Link>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Not logged in — Sign in + Register */
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                href="/register/student"
                className="px-4 py-1.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ touchAction: "manipulation" }}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-4 pb-6 space-y-1">
          {/* Theme toggle */}
          <div className="pb-3">
            <ThemeToggle />
          </div>

          {/* Nav links */}
          {navLinks.map((link) => {
            const isActive = pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Auth section */}
          {user ? (
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register/student"
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Get Started — Student
              </Link>
              <Link
                href="/register/teacher"
                className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 transition-colors"
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
