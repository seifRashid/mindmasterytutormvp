"use client";

import { useState } from "react";
import { FolderTree, Search, Filter, Trash2, SlidersHorizontal } from "lucide-react";
import { EditTopicModal } from "./EditTopicModal";
import { DeleteTopicModal } from "./DeleteTopicModal";
import { CrudModal } from "./CrudModal";

interface Topic {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  orderNumber: number;
  createdAt: string;
}

interface Subject {
  id: string;
  classId: string;
  title: string;
}

interface ClassLevel {
  id: string;
  name: string;
}

interface TopicsListManagerProps {
  topics: Topic[];
  subjects: Subject[];
  classes: ClassLevel[];
}

export function TopicsListManager({ topics, subjects, classes }: TopicsListManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter subjects based on selected class
  const filteredSubjectsList = selectedClassId
    ? subjects.filter((s) => s.classId === selectedClassId)
    : subjects;

  // Filter topics
  const filteredTopics = topics.filter((top) => {
    const parentSub = subjects.find((s) => s.id === top.subjectId);
    
    // Name match
    const nameMatch = top.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Class match
    const classMatch = selectedClassId
      ? parentSub?.classId === selectedClassId
      : true;

    // Subject match
    const subjectMatch = selectedSubjectId
      ? top.subjectId === selectedSubjectId
      : true;

    return nameMatch && classMatch && subjectMatch;
  });

  return (
    <div className="space-y-4">
      {/* ── SEARCH & FILTER CONTROLS ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search topics by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Action Toggle buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
              showFilters || selectedClassId || selectedSubjectId
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {(selectedClassId || selectedSubjectId) && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>

          <CrudModal
            type="topic"
            subjects={subjects.map((s) => ({ id: s.id, title: s.title }))}
          />
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grade Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Grade / Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId(""); // Reset dependent filters
                }}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Grades</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Parent Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">All Subjects</option>
                {filteredSubjectsList.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPICS TABLE VIEW ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        {filteredTopics.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Trash2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold">No topics found matching filters</p>
            <p className="text-xs mt-1">Try adjusting your filters or typing a different title.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-955 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4">Topic Title</th>
                <th className="p-4">Parent Subject</th>
                <th className="p-4">Class Level</th>
                <th className="p-4">Order Number</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTopics.map((top) => {
                const parentSub = subjects.find((s) => s.id === top.subjectId);
                const parentClass = parentSub
                  ? classes.find((c) => c.id === parentSub.classId)
                  : null;

                return (
                  <tr key={top.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderTree className="w-4 h-4 text-cyan-500" />
                      {top.title}
                    </td>
                    <td className="p-4 text-slate-500 font-semibold">{parentSub?.title || "Math"}</td>
                    <td className="p-4 text-slate-500 font-semibold">{parentClass?.name || "N/A"}</td>
                    <td className="p-4 text-slate-500 font-mono"># {top.orderNumber}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-1">
                      <EditTopicModal
                        topic={{
                          id: top.id,
                          subjectId: top.subjectId,
                          title: top.title,
                          description: top.description || "",
                          orderNumber: top.orderNumber,
                        }}
                        subjects={subjects.map((s) => ({ id: s.id, title: s.title }))}
                      />
                      <DeleteTopicModal topic={top} />
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
