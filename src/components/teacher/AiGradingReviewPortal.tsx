"use client";

import { useState, useTransition } from "react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Loader2,
  Check,
  User,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { overrideAiGradeAction, retryPendingGradingAction } from "@/actions/grading-actions";

export interface SubmissionItem {
  id: string;
  quizAttemptAnswerId: string;
  questionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  maxScore: number;
  status: string;
  confidence: number;
  criteriaResults: any;
  missingConcepts: any;
  detectedMisconceptions: any;
  feedback: string;
  model: string;
  promptVersion: string;
  requiresTeacherReview: boolean;
  teacherScore: number | null;
  teacherFeedback: string | null;
  teacherReviewedAt: Date | string | null;
  createdAt: Date | string;
  textAnswer: string | null;
  gradingStatus: string;
  attemptId: string;
  questionText: string;
  expectedAnswer: string | null;
  gradingRubric: any;
  quizId: string;
}

interface AiGradingReviewPortalProps {
  initialSubmissions: SubmissionItem[];
  role: "teacher" | "admin";
}

export function AiGradingReviewPortal({
  initialSubmissions,
  role,
}: AiGradingReviewPortalProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState<"all" | "requires_review" | "overridden">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form states for teacher override
  const [overrideScores, setOverrideScores] = useState<Record<string, number>>({});
  const [overrideFeedbacks, setOverrideFeedbacks] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter list
  const filteredSubmissions = submissions.filter((item) => {
    if (reviewFilter === "requires_review" && !item.requiresTeacherReview) return false;
    if (reviewFilter === "overridden" && item.teacherScore === null) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.studentName.toLowerCase().includes(q);
      const matchEmail = item.studentEmail.toLowerCase().includes(q);
      const matchQuestion = item.questionText.toLowerCase().includes(q);
      const matchAnswer = (item.textAnswer || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchQuestion || matchAnswer;
    }

    return true;
  });

  const handleSaveOverride = (item: SubmissionItem) => {
    const scoreToSet = overrideScores[item.id] ?? item.teacherScore ?? item.score;
    const feedbackToSet = overrideFeedbacks[item.id] ?? item.teacherFeedback ?? "";

    setSavingId(item.id);
    startTransition(async () => {
      const res = await overrideAiGradeAction({
        resultId: item.id,
        teacherScore: scoreToSet,
        teacherFeedback: feedbackToSet,
      });

      setSavingId(null);
      if (res.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  teacherScore: scoreToSet,
                  teacherFeedback: feedbackToSet,
                  teacherReviewedAt: new Date(),
                  requiresTeacherReview: false,
                }
              : s
          )
        );
        setSuccessMsg(`Grade updated to ${scoreToSet}/${item.maxScore} for ${item.studentName}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(res.error || "Failed to update override.");
      }
    });
  };

  const handleRetry = (item: SubmissionItem) => {
    setRetryingId(item.quizAttemptAnswerId);
    startTransition(async () => {
      const res = await retryPendingGradingAction(item.quizAttemptAnswerId);
      setRetryingId(null);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error || "Retry failed.");
      }
    });
  };

  const countPendingReview = submissions.filter((s) => s.requiresTeacherReview).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> AI Evaluation Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            AI Grading Review & Grade Overrides
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review AI assessments, inspect rubric satisfaction, and override scores with full audit trail preservation.
          </p>
        </div>

        {countPendingReview > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-bold shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{countPendingReview} submissions require teacher attention</span>
          </div>
        )}
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-2xl font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, or question content..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setReviewFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              reviewFilter === "all"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setReviewFilter("requires_review")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              reviewFilter === "requires_review"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Requires Review ({countPendingReview})
          </button>
          <button
            type="button"
            onClick={() => setReviewFilter("overridden")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              reviewFilter === "overridden"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Overridden ({submissions.filter((s) => s.teacherScore !== null).length})
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredSubmissions.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <Brain className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No graded submissions found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No student submissions matched your current search filters."
              : "When students complete open-ended quiz questions, their AI evaluations and rubric breakdowns will appear here."}
          </p>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((item) => {
          const isExpanded = expandedId === item.id;
          const currentTeacherScore =
            overrideScores[item.id] ?? item.teacherScore ?? item.score;
          const isOverridden = item.teacherScore !== null;

          return (
            <div
              key={item.id}
              className={`p-5 bg-white dark:bg-slate-900 rounded-3xl border transition-all ${
                item.requiresTeacherReview
                  ? "border-amber-300 dark:border-amber-800/80 shadow-sm"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Submission Row Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {item.studentName}
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({item.studentEmail})
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      Submitted: {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Badges */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === "correct"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : item.status === "mostly_correct"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                        : item.status === "partially_correct"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    }`}
                  >
                    AI: {item.status.replace("_", " ")} ({item.score}/{item.maxScore})
                  </span>

                  {isOverridden && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      Teacher Override: {item.teacherScore}/{item.maxScore}
                    </span>
                  )}

                  {item.requiresTeacherReview && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Review Advised
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title={isExpanded ? "Collapse Details" : "Inspect & Override"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Question Statement & Student Answer Preview */}
              <div className="pt-3 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.questionText}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Student Answer:
                  </span>
                  <p className="text-slate-900 dark:text-slate-100 italic leading-relaxed">
                    &ldquo;{item.textAnswer || "(No answer provided)"}&rdquo;
                  </p>
                </div>
              </div>

              {/* Expanded Inspection & Override Section */}
              {isExpanded && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reference Expected Answer */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Reference Expected Answer:
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.expectedAnswer || "None specified"}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-1">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Feedback to Student:
                      </span>
                      <p className="text-indigo-950 dark:text-indigo-200 leading-relaxed">
                        {item.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Criteria Satisfaction Breakdown */}
                  {Array.isArray(item.criteriaResults) && item.criteriaResults.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Marking Rubric Criteria Breakdown:
                      </span>
                      <div className="space-y-1">
                        {item.criteriaResults.map((cr: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                          >
                            <div className="flex items-start gap-2">
                              {cr.satisfied ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                              )}
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {cr.criterion}
                                </span>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {cr.explanation}
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                              {cr.marksAwarded} / {cr.maxMarks} marks
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Concepts or Misconceptions */}
                  {(item.missingConcepts?.length > 0 || item.detectedMisconceptions?.length > 0) && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {item.missingConcepts?.length > 0 && (
                        <div className="text-[11px] text-amber-800 dark:text-amber-300">
                          <strong>Missing concepts:</strong> {item.missingConcepts.join(", ")}
                        </div>
                      )}
                      {item.detectedMisconceptions?.length > 0 && (
                        <div className="text-[11px] text-rose-700 dark:text-rose-400">
                          <strong>Detected misconceptions:</strong>{" "}
                          {item.detectedMisconceptions.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TEACHER OVERRIDE FORM ── */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" /> Teacher Grade Override & Audit
                      </span>
                      {isOverridden && item.teacherReviewedAt && (
                        <span className="text-[10px] text-blue-700 dark:text-blue-400">
                          Overridden on {new Date(item.teacherReviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Teacher Score (Max {item.maxScore}):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.maxScore}
                          value={currentTeacherScore}
                          onChange={(e) =>
                            setOverrideScores((prev) => ({
                              ...prev,
                              [item.id]: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Teacher Feedback (Optional notes to student):
                        </label>
                        <input
                          type="text"
                          value={overrideFeedbacks[item.id] ?? item.teacherFeedback ?? ""}
                          onChange={(e) =>
                            setOverrideFeedbacks((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. Good explanation of concepts, added 1 mark for clarity."
                          className="w-full px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-slate-500">
                        Audit Log: Original AI score ({item.score}/{item.maxScore}) is preserved.
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSaveOverride(item)}
                        disabled={savingId === item.id}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {savingId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" /> Save Override
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
