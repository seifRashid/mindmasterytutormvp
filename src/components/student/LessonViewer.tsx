"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Video,
  Paperclip,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  File,
  Image as ImageIcon,
  LinkIcon,
  Presentation,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { Lesson, LessonAttachment, Quiz, Question, AttachmentType } from "@/lib/mock-data";


type Tab = "notes" | "video" | "materials" | "quiz";

interface LessonViewerProps {
  lesson: Lesson;
  quiz?: Quiz | null;
  questions?: Question[];
  prevLessonId?: string;
  nextLessonId?: string;
  topicQuizId?: string;
  initialCompleted?: boolean;
}

const ATTACHMENT_ICONS: Record<AttachmentType, React.ElementType> = {
  pdf: File,
  doc: FileText,
  image: ImageIcon,
  link: LinkIcon,
  presentation: Presentation,
  other: Paperclip,
};

const ATTACHMENT_COLORS: Record<AttachmentType, string> = {
  pdf: "bg-rose-50 dark:bg-rose-950/40 text-rose-500",
  doc: "bg-blue-50 dark:bg-blue-950/40 text-blue-500",
  image: "bg-violet-50 dark:bg-violet-950/40 text-violet-500",
  link: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500",
  presentation: "bg-amber-50 dark:bg-amber-950/40 text-amber-500",
  other: "bg-slate-100 dark:bg-slate-800 text-slate-500",
};

// ── Inline Quiz Engine ───────────────────────────────────────────────────────

function InlineQuiz({ quiz, questions }: { quiz: Quiz; questions: Question[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({}); // questionId → answerId
  const [shortInputs, setShortInputs] = useState<Record<string, string>>({}); // questionId → text
  const [submitted, setSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null);
  const [timedOut, setTimedOut] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted || timedOut) return;
    if (timeLeft <= 0) { setTimedOut(true); handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft((p) => (p !== null ? p - 1 : null)), 1000);
    return () => clearTimeout(t);
  });

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSubmit = () => {
    setSubmitted(true);
    setAttempts((p) => p + 1);
  };

  const handleRetry = () => {
    setSelected({});
    setShortInputs({});
    setSubmitted(false);
    setCurrent(0);
    if (quiz.timeLimitMinutes) setTimeLeft(quiz.timeLimitMinutes * 60);
    setTimedOut(false);
  };

  // Score calculation
  const score = questions.reduce((acc, q) => {
    if (q.type === "short_answer") {
      const correct = q.answers.find((a) => a.isCorrect)?.answer.toLowerCase().trim() ?? "";
      const given = (shortInputs[q.id] ?? "").toLowerCase().trim();
      return acc + (given === correct ? 1 : 0);
    }
    const sel = selected[q.id];
    const correctAns = q.answers.find((a) => a.isCorrect);
    return acc + (sel === correctAns?.id ? 1 : 0);
  }, 0);

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = pct >= quiz.passingScore;

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <HelpCircle className="w-10 h-10 mb-3" />
        <p className="text-sm font-medium">No questions available for this quiz.</p>
      </div>
    );
  }

  // Results screen
  if (submitted) {
    return (
      <div className="space-y-6">
        {/* Score card */}
        <div className={`p-6 rounded-2xl border text-center ${
          passed
            ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
            : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
        }`}>
          <div className="flex justify-center mb-3">
            {passed
              ? <Trophy className="w-12 h-12 text-amber-500" />
              : <AlertCircle className="w-12 h-12 text-rose-500" />
            }
          </div>
          <p className="text-4xl font-black mb-1" style={{ color: passed ? "#10b981" : "#ef4444" }}>
            {pct}%
          </p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {score} / {questions.length} correct · {passed ? "✅ Passed!" : `❌ Need ${quiz.passingScore}% to pass`}
          </p>
        </div>

        {/* Per-question feedback */}
        {quiz.showFeedback && (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isShort = q.type === "short_answer";
              const correctAns = q.answers.find((a) => a.isCorrect);
              let wasCorrect = false;
              if (isShort) {
                const given = (shortInputs[q.id] ?? "").toLowerCase().trim();
                wasCorrect = given === correctAns?.answer.toLowerCase().trim();
              } else {
                wasCorrect = selected[q.id] === correctAns?.id;
              }

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-sm space-y-2 ${
                    wasCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {wasCorrect
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    }
                    <p className="font-semibold text-slate-900 dark:text-white">Q{idx + 1}: {q.question}</p>
                  </div>
                  {!wasCorrect && (
                    <div className="ml-6 space-y-1">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Correct Answer: {correctAns?.answer}
                      </p>
                      {(attempts >= 3 || quiz.showFeedback) && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                            💡 {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!passed && (
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  const q = questions[current];
  const isShort = q.type === "short_answer";

  return (
    <div className="space-y-5">
      {/* Quiz header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{quiz.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Passing score: {quiz.passingScore}% · Question {current + 1} of {questions.length}
          </p>
        </div>
        {timeLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            timeLeft <= 30 ? "bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <p className="text-base font-bold text-slate-900 dark:text-white">{q.question}</p>

        {/* Answers */}
        {isShort ? (
          <input
            value={shortInputs[q.id] ?? ""}
            onChange={(e) => setShortInputs((p) => ({ ...p, [q.id]: e.target.value }))}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <div className="space-y-2">
            {q.answers.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected((p) => ({ ...p, [q.id]: a.id }))}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                  selected[q.id] === a.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                }`}
              >
                {a.answer}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent((p) => Math.max(0, p - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((p) => p + 1)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main LessonViewer ────────────────────────────────────────────────────────

export function LessonViewer({
  lesson,
  quiz,
  questions = [],
  prevLessonId,
  nextLessonId,
  topicQuizId,
  initialCompleted = false,
}: LessonViewerProps) {
  // Decide default tab: Notes if there's content, otherwise Video
  const defaultTab: Tab = lesson.richContent ? "notes" : lesson.videoUrl ? "video" : "materials";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const tabs: { key: Tab; label: string; hasContent: boolean }[] = [
    { key: "notes", label: "📖 Notes", hasContent: !!lesson.richContent },
    { key: "video", label: "🎬 Video", hasContent: !!lesson.videoUrl },
    { key: "materials", label: "📎 Materials", hasContent: (lesson.attachments?.length ?? 0) > 0 },
    { key: "quiz", label: "✏️ Quiz", hasContent: !!quiz },
  ];

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 relative py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            {/* Dot indicator when tab has content */}
            {tab.hasContent && (
              <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                activeTab === tab.key ? "bg-blue-500" : "bg-slate-400 dark:bg-slate-600"
              }`} />
            )}
          </button>
        ))}
      </div>

      {/* ── NOTES ───────────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {lesson.richContent ? (
            <div className="p-6">
              <div
                className="rte-content text-slate-900 dark:text-slate-100 text-sm leading-7"
                dangerouslySetInnerHTML={{ __html: lesson.richContent }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <BookOpen className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{lesson.title}</p>
              <p className="text-sm mt-1">{lesson.description}</p>
              <p className="text-xs mt-4 text-slate-400">No detailed notes available for this lesson.</p>
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO ───────────────────────────────────────────────────── */}
      {activeTab === "video" && (
        <div className="space-y-4">
          {lesson.videoUrl ? (
            <>
              <div className="rounded-2xl overflow-hidden bg-slate-950 shadow-2xl aspect-video border border-slate-800">
                <iframe
                  src={lesson.videoUrl}
                  title={lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              </div>
              {lesson.duration > 0 && (
                <p className="text-xs text-slate-500 text-center">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Estimated duration: {Math.floor(lesson.duration / 60)} min{Math.floor(lesson.duration / 60) !== 1 ? "s" : ""}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
              <Video className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">No video for this lesson</p>
              <p className="text-xs mt-1">Check the Notes tab for lesson content</p>
            </div>
          )}
        </div>
      )}

      {/* ── MATERIALS ───────────────────────────────────────────────── */}
      {activeTab === "materials" && (
        <div className="space-y-3">
          {lesson.attachments && lesson.attachments.length > 0 ? (
            <>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {lesson.attachments.length} Learning Material{lesson.attachments.length > 1 ? "s" : ""}
              </p>
              {lesson.attachments.map((att) => {
                const Icon = ATTACHMENT_ICONS[att.type];
                return (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group"
                  >
                    <div className={`p-3 rounded-xl ${ATTACHMENT_COLORS[att.type]} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {att.name}
                      </p>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{att.url}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase flex-shrink-0">
                      {att.type}
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </a>
                );
              })}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
              <Paperclip className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">No materials for this lesson</p>
              <p className="text-xs mt-1">Your teacher hasn&apos;t uploaded any materials yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── QUIZ ────────────────────────────────────────────────────── */}
      {activeTab === "quiz" && (
        <div>
          {quiz ? (
            <InlineQuiz quiz={quiz} questions={questions} />
          ) : topicQuizId ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
              <HelpCircle className="w-10 h-10 text-blue-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No lesson quiz — but there&apos;s a topic quiz available!
              </p>
              <Link
                href={`/dashboard/quizzes/${topicQuizId}`}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
              >
                Take Topic Quiz
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
              <HelpCircle className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">No quiz for this lesson</p>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation: Prev / Next lesson ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
        {prevLessonId ? (
          <Link
            href={`/dashboard/lessons/${prevLessonId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Lesson</span>
            <span className="sm:hidden">Prev</span>
          </Link>
        ) : (
          <div />
        )}

        {nextLessonId ? (
          <Link
            href={`/dashboard/lessons/${nextLessonId}`}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
          >
            <span className="hidden sm:inline">Next Lesson</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : topicQuizId ? (
          <Link
            href={`/dashboard/quizzes/${topicQuizId}`}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all"
          >
            Topic Quiz
            <HelpCircle className="w-4 h-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
