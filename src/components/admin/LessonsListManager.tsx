"use client";

import { useState, useMemo } from "react";
import { Video, FileText, HelpCircle, Pencil, Trash2, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { LessonActionButtons } from "./LessonActionButtons";

interface LessonsListManagerProps {
  lessons: any[];
  topics: any[];
  subjects: any[];
  classes: any[];
  isRecycleBin: boolean;
  isAdmin?: boolean;
}

export function LessonsListManager({
  lessons,
  topics,
  subjects,
  classes,
  isRecycleBin,
  isAdmin = false,
}: LessonsListManagerProps) {
  // Filter States
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  const editBaseUrl = isAdmin ? "/admin/lessons" : "/teacher/lessons";
  const accentColor = isAdmin ? "focus:ring-blue-500" : "focus:ring-indigo-500";
  const editBg = isAdmin ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100" : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100";

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
      const allowedSubjectIds = new Set(subjects.filter((s) => s.classId === selectedClassId).map((s) => s.id));
      return topics.filter((t) => allowedSubjectIds.has(t.subjectId));
    }
    return topics;
  }, [selectedClassId, selectedSubjectId, topics, subjects]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((les) => {
      if (isRecycleBin) return true; // Do not apply filters to Recycle Bin items

      const topic = topics.find((t) => t.id === les.topicId);
      const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;
      const classLevel = subject ? classes.find((c) => c.id === subject.classId) : null;

      const matchesTitle = les.title.toLowerCase().includes(searchTitle.trim().toLowerCase());
      const matchesClass = !selectedClassId || classLevel?.id === selectedClassId;
      const matchesSubject = !selectedSubjectId || subject?.id === selectedSubjectId;
      const matchesTopic = !selectedTopicId || topic?.id === selectedTopicId;

      return matchesTitle && matchesClass && matchesSubject && matchesTopic;
    });
  }, [lessons, isRecycleBin, searchTitle, selectedClassId, selectedSubjectId, selectedTopicId, topics, subjects, classes]);

  return (
    <div className="space-y-5">
      {/* ── FILTER CONTROL PANEL ───────────────────────────────────── */}
      {!isRecycleBin && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold">Filter & Search Lessons</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search by Title */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Lesson Title
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder="Search by title..."
                  className={`w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
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
                  setSelectedSubjectId(""); // Reset dependent filters
                  setSelectedTopicId("");
                }}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="">All Grades</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                  setSelectedTopicId(""); // Reset dependent filters
                }}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="">All Subjects</option>
                {filteredSubjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic / Subtopic Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Topic / Subtopic
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 ${accentColor} transition-all`}
              >
                <option value="">All Topics</option>
                {filteredTopicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── LESSONS TABLE VIEW ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Trash2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold">No lessons found matching filters</p>
            <p className="text-xs mt-1">Try adjusting your filters or typing a different title.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Lesson</th>
                <th className="p-4 hidden md:table-cell">Topic / Subject</th>
                <th className="p-4 hidden lg:table-cell">{isRecycleBin ? "Deleted At" : "Duration"}</th>
                <th className="p-4">{isRecycleBin ? "Time Remaining" : "Content"}</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLessons.map((les) => {
                const topic = topics.find((t) => t.id === les.topicId);
                const subject = topic ? subjects.find((s) => s.id === topic.subjectId) : null;
                const classLevel = subject ? classes.find((c) => c.id === subject.classId) : null;

                // Calculate remaining time in Recycle Bin
                let hoursLeft = 0;
                if (isRecycleBin && les.deletedAt) {
                  const ageMs = new Date().getTime() - new Date(les.deletedAt).getTime();
                  hoursLeft = Math.max(0, 48 - Math.floor(ageMs / (1000 * 60 * 60)));
                }

                return (
                  <tr key={les.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 max-w-xs">
                      <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                        {les.title}
                      </p>
                      <p className="text-slate-500 mt-0.5 line-clamp-1">{les.description}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{topic?.title ?? "—"}</p>
                      <p className="text-slate-400">{classLevel?.name} · {subject?.title}</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-slate-500 font-mono">
                      {isRecycleBin && les.deletedAt
                        ? new Date(les.deletedAt).toLocaleDateString()
                        : les.duration
                        ? `${Math.floor(les.duration / 60)}m`
                        : "—"}
                    </td>
                    <td className="p-4">
                      {isRecycleBin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold font-mono">
                          ⏰ {hoursLeft}h left
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {les.richContent && (
                            <span title="Has lesson notes">
                              <FileText className="w-4 h-4 text-indigo-500" />
                            </span>
                          )}
                          {les.videoUrl && (
                            <span title="Has video">
                              <Video className="w-4 h-4 text-emerald-500" />
                            </span>
                          )}
                          {les.lessonQuizId && (
                            <span title="Has inline quiz">
                              <HelpCircle className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2.5">
                        {isRecycleBin ? (
                          <LessonActionButtons
                            lessonId={les.id}
                            lessonTitle={les.title}
                            mode="recycle"
                            isAdmin={isAdmin}
                          />
                        ) : (
                          <>
                            <Link
                              href={`${editBaseUrl}/${les.id}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${editBg} font-semibold transition-colors`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <LessonActionButtons
                              lessonId={les.id}
                              lessonTitle={les.title}
                              mode="active"
                              isAdmin={isAdmin}
                            />
                          </>
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
