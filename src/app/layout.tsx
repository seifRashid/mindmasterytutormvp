import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mind Mastery Tutor — E-Learning Portal",
  description:
    "Learn progressively through subjects, topics, videos and quizzes with Mind Mastery Tutor.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="glass-theme orange-theme min-h-full flex flex-col overflow-x-hidden">
        <ThemeProvider>
          {/* Global animated background */}
          <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
            {/* Main gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffedd5_0%,#fff7ed_48%,#fffaf7_100%)]" />

            {/* Animated orange orb */}
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl animate-[float_10s_ease-in-out_infinite]" />

            {/* Animated amber orb */}
            <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-amber-300/25 blur-3xl animate-[floatReverse_14s_ease-in-out_infinite]" />

            {/* Bottom glow */}
            <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl animate-[pulseGlow_8s_ease-in-out_infinite]" />

            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                  backgroundImage:
                  "linear-gradient(rgba(100,116,139,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.12) 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }}
            />
          </div>

          {/* Application content */}
          <main className="relative flex min-h-screen flex-1 flex-col">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
