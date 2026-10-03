"use client";

import { useState, useMemo } from "react";
import { HelpCircle, Pencil, Trash2, Search, SlidersHorizontal, Sparkles, Lock, UserCheck } from "lucide-react";
import Link from "next/link";
import { QuizActionButtons } from "./QuizActionButtons";
import { toUuid } from "@/lib/id-mapper";

interface QuizzesListManagerProps {
  quizzes: any[];
  questions: any[];
  topics: any[];
  subjects: any[];
  classes: any[];
  lessons?: any[];
  isRecycleBin: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
}

export function QuizzesListManager({
  quizzes,
  questions,
  topics,
  subjects,
  classes,
  lessons = [],
  isRecycleBin,
  isAdmin = false,
  currentUserId,
}: QuizzesListManagerProps) {
  // Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [authorFilter, setAuthorFilter] = useState<"all" | "mine">("all");

  const editBaseUrl = isAdmin ? "/admin/quizzes" : "/teacher/quizzes";
  const accentColor = isAdmin ? "focus:ring-blue-500" : "focus:ring-indigo-500";
  const editBg = isAdmin
    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100";

  const userUuid = currentUserId ? toUuid(currentUserId) : null;

  // Question counts by quizId
  const questionCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of questions) {
      if (q.quizId) {
        map[q.quizId] = (map[q.quizId] || 0) + 1;
      }
    }
    return map;
  }, [questions]);

  // Set of quizIds that have AI grading
  const aiGradedQuizIds = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (q.quizId && q.aiGradingEnabled) {
        set.add(q.quizId);
      }
    }
    return set;
  }, [questions]);

  // Dynamic Dependent Filters
  const filteredSubjectsList = useMemo(() => {
    if (!selectedClassId) return subjects;
    return subjects.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId, subjects]);

  const filteredTopicsList = useMemo(() => {
    if (selectedSubjectId) {
      return topics.filter((t) => t.subjectId === selectedSubjectId);
    }
    if (selectedClassId) {
      const allowedSubjectIds = new Set(
        subjects.filter((s) => s.classId === selectedClassId).map((s) => s.id)
      );
      return topics.filter((t) => allowedSubjectIds.has(t.subjectId));
    }
    return topics;
  }, [selectedClassId, selectedSubjectId, topics, subjects]);

  // Filtered quizzes list
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      if (isRecycleBin) {
        if (!isAdmin && authorFilter === "mine" && userUuid) {
          return quiz.createdBy && toUuid(quiz.createdBy) === userUuid;
        }
        return true;
      }

      // Resolve topic, subject, class
      const topic =
        topics.find((t) => t.id === quiz.topicId) ||
        (quiz.lessonId
          ? topics.find(
              (t) => t.id === lessons.find((l) => l.id === quiz.lessonId)?.topicId
            )
          : null);
      const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;
      const classLevel = subject ? classes.find((c) => c.id === subject.classId) : null;

      const matchesTitle = quiz.title
        ?.toLowerCase()
        .includes(searchTitle.trim().toLowerCase());
      const matchesClass = !selectedClassId || classLevel?.id === selectedClassId;
      const matchesSubject = !selectedSubjectId || subject?.id === selectedSubjectId;
      const matchesTopic = !selectedTopicId || topic?.id === selectedTopicId;

      let matchesAuthor = true;
      if (!isAdmin && authorFilter === "mine" && userUuid) {
        matchesAuthor = Boolean(quiz.createdBy && toUuid(quiz.createdBy) === userUuid);
      }

      return matchesTitle && matchesClass && matchesSubject && matchesTopic && matchesAuthor;
    });
  }, [
    quizzes,
    isRecycleBin,
    searchTitle,
    selectedClassId,
    selectedSubjectId,
    selectedTopicId,
    authorFilter,
    isAdmin,
    userUuid,
    topics,
    subjects,
    classes,
    lessons,
  ]);

  return (
    <div className="space-y-5">
      {/* ── FILTER CONTROL PANEL ───────────────────────────────────── */}
      {!isRecycleBin && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold">Filter & Search Quizzes</h2>
            </div>

            {/* Quick Author toggle for teachers */}
            {!isAdmin && userUuid && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthorFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    authorFilter === "all"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  All Quizzes
                </button>
                <button
                  type="button"
                  onClick={() => setAuthorFilter("mine")}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    authorFilter === "mine"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  My Quizzes Only
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by Title */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Quiz Title
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Search by title..."
                  className={`w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
                />
              </div>
            </div>

            {/* Grade / Class Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Grade / Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId("");
                  setSelectedTopicId("");
                }}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  All Grades
                </option>
                {classes.map((cls) => (
                  <option
                    key={cls.id}
                    value={cls.id}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedTopicId("");
                }}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  All Subjects
                </option>
                {filteredSubjectsList.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Topic / Subtopic
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  All Topics
                </option>
                {filteredTopicsList.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZZES TABLE VIEW ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        {filteredQuizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            {isRecycleBin ? (
              <Trash2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            ) : (
              <HelpCircle className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            )}
            <p className="text-sm font-semibold">
              {isRecycleBin ? "Recycle bin is empty" : "No quizzes found matching filters"}
            </p>
            <p className="text-xs mt-1 text-slate-400">
              {isRecycleBin
                ? "Deleted quizzes will appear here for up to 30 days before being purged."
                : "Try adjusting your filters or typing a different quiz title."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Quiz Title</th>
                <th className="p-4 hidden md:table-cell">Topic / Subject</th>
                <th className="p-4 hidden lg:table-cell">Passing Score</th>
                <th className="p-4">{isRecycleBin ? "Time Remaining" : "Questions"}</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredQuizzes.map((quiz) => {
                const topic =
                  topics.find((t) => t.id === quiz.topicId) ||
                  (quiz.lessonId
                    ? topics.find(
                        (t) => t.id === lessons.find((l) => l.id === quiz.lessonId)?.topicId
                      )
                    : null);
                const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;
                const classLevel = subject ? classes.find((c) => c.id === subject.classId) : null;
                const questionCount = questionCountMap[quiz.id] || 0;
                const isAiGraded = aiGradedQuizIds.has(quiz.id);

                // Ownership calculation: admin has full rights; teacher only owns quizzes created by them
                const isOwner = Boolean(userUuid && quiz.createdBy && toUuid(quiz.createdBy) === userUuid);
                const canModify = isAdmin || isOwner;

                // Calculate remaining time in Recycle Bin (30 days total retention)
                let daysLeft = 30;
                let hoursLeft = 720;
                if (isRecycleBin && quiz.deletedAt) {
                  const ageMs = new Date().getTime() - new Date(quiz.deletedAt).getTime();
                  const totalHoursPassed = Math.floor(ageMs / (1000 * 60 * 60));
                  hoursLeft = Math.max(0, 720 - totalHoursPassed);
                  daysLeft = Math.max(0, Math.ceil(hoursLeft / 24));
                }

                return (
                  <tr
                    key={quiz.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                            {quiz.title}
                          </p>
                          {isAiGraded && (
                            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Graded
                            </span>
                          )}
                          {!isAdmin && (
                            <div className="mt-1">
                              {isOwner ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                                  Created by You
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  Other Author
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {topic?.title ?? (quiz.lessonId ? "Inline Lesson Quiz" : "—")}
                      </p>
                      <p className="text-slate-400">
                        {classLevel?.name ? `${classLevel.name} · ` : ""}
                        {subject?.title ?? "General"}
                      </p>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-slate-600 dark:text-slate-300 font-bold">
                      {quiz.passingScore}%
                    </td>
                    <td className="p-4">
                      {isRecycleBin ? (
                        <span
                          title={`Deleted on ${new Date(quiz.deletedAt).toLocaleString()}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold font-mono"
                        >
                          ⏰ {daysLeft > 1 ? `${daysLeft} days left` : `${hoursLeft}h left`}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold">
                          {questionCount} Qs
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2.5">
                        {canModify ? (
                          isRecycleBin ? (
                            <QuizActionButtons
                              quizId={quiz.id}
                              quizTitle={quiz.title}
                              mode="recycle"
                              isAdmin={isAdmin}
                            />
                          ) : (
                            <>
                              <Link
                                href={`${editBaseUrl}/${quiz.id}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${editBg} font-semibold transition-colors`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </Link>
                              <QuizActionButtons
                                quizId={quiz.id}
                                quizTitle={quiz.title}
                                mode="active"
                                isAdmin={isAdmin}
                              />
                            </>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold select-none"
                              title="You can only edit or delete quizzes created by you"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              View Only
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
