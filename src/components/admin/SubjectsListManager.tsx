"use client";

import { useState, useMemo } from "react";
import { BookOpen, Search, X, SlidersHorizontal, ArrowUpDown, Trash2, RotateCcw } from "lucide-react";
import { EditSubjectModal } from "./EditSubjectModal";
import { DeleteSubjectModal } from "./DeleteSubjectModal";

export interface SubjectItem {
  id: string;
  classId: string;
  title: string;
  slug: string;
  description: string;
  icon?: string;
  createdAt: string;
}

export interface ClassItem {
  id: string;
  name: string;
}

interface SubjectsListManagerProps {
  subjects: SubjectItem[];
  classes: ClassItem[];
}

export function SubjectsListManager({ subjects, classes }: SubjectsListManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc" | "class">("newest");

  // Create a map for quick class lookup
  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classes]);

  // Filtered and sorted subjects list
  const filteredSubjects = useMemo(() => {
    let result = subjects.filter((sub) => {
      // Search matching across title, description, and slug
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        sub.title.toLowerCase().includes(query) ||
        (sub.description && sub.description.toLowerCase().includes(query)) ||
        (sub.slug && sub.slug.toLowerCase().includes(query));

      // Class level matching
      const matchesClass = !selectedClassId || sub.classId === selectedClassId;

      return matchesSearch && matchesClass;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "class") {
        const classNameA = classMap.get(a.classId) || "";
        const classNameB = classMap.get(b.classId) || "";
        const classCompare = classNameA.localeCompare(classNameB);
        return classCompare !== 0 ? classCompare : a.title.localeCompare(b.title);
      }
      // Default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [subjects, searchQuery, selectedClassId, sortBy, classMap]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedClassId !== "" || sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClassId("");
    setSortBy("newest");
  };

  return (
    <div className="space-y-4">
      {/* ── SEARCH & FILTER CONTROLS ────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & Sorting */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Class / Grade Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                title="Filter by Class Level"
              >
                <option value="">All Class Levels</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                title="Sort Subjects"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="title-asc">Sort: Title (A - Z)</option>
                <option value="title-desc">Sort: Title (Z - A)</option>
                <option value="class">Sort: Class Level</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Status / Results Count */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredSubjects.length}</strong> of{" "}
            <strong>{subjects.length}</strong> subjects
          </span>
          {hasActiveFilters && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">Filters active</span>
          )}
        </div>
      </div>

      {/* ── SUBJECTS TABLE VIEW ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Trash2 className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No subjects found matching your filters
            </p>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
              Try adjusting your search terms or selecting a different class level.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-4">Subject Title</th>
                <th className="p-4">Class Level</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSubjects.map((sub) => {
                const parentClassName = classMap.get(sub.classId) || "Grade 8";

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors duration-150 group"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span>{sub.title}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                      {parentClassName}
                    </td>
                    <td
                      className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate"
                      title={sub.description}
                    >
                      {sub.description || "—"}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1">
                      <EditSubjectModal
                        subject={{
                          id: sub.id,
                          classId: sub.classId,
                          title: sub.title,
                          description: sub.description || "",
                          icon: sub.icon || "BookOpen",
                        }}
                        classes={classes}
                      />
                      <DeleteSubjectModal subject={sub} />
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
