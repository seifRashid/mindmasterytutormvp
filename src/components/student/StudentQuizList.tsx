"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Search,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Award,
  Layers,
  Brain,
  Filter,
} from "lucide-react";

export interface StudentQuizCardData {
  id: string;
  title: string;
  topicTitle: string;
  subjectTitle: string;
  subjectSlug: string;
  passingScore: number;
  timeLimitMinutes: number;
  showFeedback: boolean;
  questionCount: number;
  hasAiGrading: boolean;
  openEndedCount: number;
  attemptCount: number;
  bestScore: number | null;
  lastScore: number | null;
  passed: boolean;
  lastAttemptDate: string | null;
}

interface StudentQuizListProps {
  quizzes: StudentQuizCardData[];
  studentName: string;
}

export function StudentQuizList({ quizzes, studentName }: StudentQuizListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "passed" | "unattempted" | "ai">("all");

  // Extract unique subjects for filter tabs
  const subjects = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subjectTitle) set.add(q.subjectTitle);
    });
    return Array.from(set);
  }, [quizzes]);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      // Search
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subjectTitle.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Subject Filter
      if (selectedSubject !== "all" && q.subjectTitle !== selectedSubject) {
        return false;
      }

      // Status Filter
      if (selectedStatus === "passed" && !q.passed) return false;
      if (selectedStatus === "unattempted" && q.attemptCount > 0) return false;
      if (selectedStatus === "ai" && !q.hasAiGrading) return false;

      return true;
    });
  }, [quizzes, searchQuery, selectedSubject, selectedStatus]);

  // Overall Statistics
  const totalQuizzes = quizzes.length;
  const passedQuizzes = quizzes.filter((q) => q.passed).length;
  const attemptedQuizzes = quizzes.filter((q) => q.attemptCount > 0);
  const avgScore =
    attemptedQuizzes.length > 0
      ? Math.round(
          attemptedQuizzes.reduce((acc, q) => acc + (q.bestScore || 0), 0) /
            attemptedQuizzes.length
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> Practice & Mastery Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Interactive Practice Quizzes
          </h1>
          <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
            Test your understanding with curriculum-aligned assessments, instant grading feedback, and AI-powered tutor evaluations.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0 w-full md:w-auto z-10 text-center">
          <div className="px-3 py-1.5">
            <p className="text-xl font-black">{totalQuizzes}</p>
            <p className="text-[10px] text-blue-100 font-semibold uppercase">Total</p>
          </div>
          <div className="px-3 py-1.5 border-x border-white/20">
            <p className="text-xl font-black text-emerald-300">{passedQuizzes}</p>
            <p className="text-[10px] text-blue-100 font-semibold uppercase">Mastered</p>
          </div>
          <div className="px-3 py-1.5">
            <p className="text-xl font-black text-amber-300">{avgScore}%</p>
            <p className="text-[10px] text-blue-100 font-semibold uppercase">Avg Score</p>
          </div>
        </div>

        {/* Decorative Background Blur */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes by title, topic, or subject..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800/70 p-1 rounded-2xl text-xs font-semibold shrink-0 overflow-x-auto">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedStatus === "all"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Quizzes
            </button>
            <button
              onClick={() => setSelectedStatus("unattempted")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedStatus === "unattempted"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Not Started
            </button>
            <button
              onClick={() => setSelectedStatus("passed")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedStatus === "passed"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Passed ({passedQuizzes})
            </button>
            <button
              onClick={() => setSelectedStatus("ai")}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                selectedStatus === "ai"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              AI Graded
            </button>
          </div>
        </div>

        {/* Subject Pill Filters */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Subject:
            </span>
            <button
              onClick={() => setSelectedSubject("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                selectedSubject === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400"
              }`}
            >
              All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  selectedSubject === sub
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Cards Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No quizzes found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or subject filters to find available assessments.
          </p>
          {(searchQuery || selectedSubject !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSubject("all");
                setSelectedStatus("all");
              }}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const hasAttempts = quiz.attemptCount > 0;
            const isPassed = quiz.passed;

            return (
              <div
                key={quiz.id}
                className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all flex flex-col justify-between group space-y-5"
              >
                {/* Top Section */}
                <div className="space-y-3">
                  {/* Subject & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/60 truncate max-w-[160px]">
                      {quiz.subjectTitle || "General Curriculum"}
                    </span>

                    {/* Completion Status Badge */}
                    {hasAttempts ? (
                      isPassed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Passed ({quiz.bestScore}%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3" />
                          Best: {quiz.bestScore}%
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        Not Attempted
                      </span>
                    )}
                  </div>

                  {/* Quiz Title & Topic */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      {quiz.topicTitle || "Comprehensive Topic"}
                    </p>
                  </div>

                  {/* Features / Details Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      {quiz.questionCount} {quiz.questionCount === 1 ? "Question" : "Questions"}
                    </span>

                    {quiz.hasAiGrading && (
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                        <Brain className="w-3 h-3 text-purple-500" />
                        ✨ AI Graded ({quiz.openEndedCount})
                      </span>
                    )}

                    {quiz.timeLimitMinutes > 0 && (
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {quiz.timeLimitMinutes} mins
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Section with Action CTA */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    Pass mark: <span className="font-bold text-slate-800 dark:text-slate-200">{quiz.passingScore}%</span>
                  </div>

                  <Link
                    href={`/dashboard/quizzes/${quiz.id}`}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      isPassed
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 hover:border-blue-300"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95"
                    }`}
                  >
                    {hasAttempts ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retake Quiz
                      </>
                    ) : (
                      <>
                        Start Quiz
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
