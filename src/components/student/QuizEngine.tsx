"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Brain,
  Clock,
  Check,
} from "lucide-react";
import Link from "next/link";
import { submitQuizAttemptAction } from "@/actions/student-actions";
import { Question, Quiz } from "@/lib/types";

interface QuizEngineProps {
  quiz: Quiz;
  questions: Question[];
  topicSlug?: string;
}

export function QuizEngine({ quiz, questions, topicSlug }: QuizEngineProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    totalMarks?: number;
    maxTotalMarks?: number;
    passed: boolean;
    passingScore: number;
    failedAttempts: number;
    showExplanations: boolean;
    hasPendingAi?: boolean;
    questionResults: Array<{
      questionId: string;
      type: string;
      selectedAnswerId?: string;
      correctAnswerId?: string;
      textAnswer?: string;
      score?: number;
      maxScore?: number;
      isCorrect: boolean;
      explanation: string;
      gradingPending?: boolean;
      aiResult?: {
        status: string;
        score: number;
        maxScore: number;
        feedback: string;
        criteriaResults?: Array<{
          criterion: string;
          marksAwarded: number;
          maxMarks: number;
          satisfied: boolean;
          explanation: string;
        }>;
        missingConcepts?: string[];
        detectedMisconceptions?: string[];
      };
    }>;
  } | null>(null);

  const handleSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleTextChange = (questionId: string, val: string) => {
    setTextAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const countAnswered = () => {
    let count = 0;
    for (const q of questions) {
      if (q.type === "open_ended" || q.type === "short_answer") {
        if ((textAnswers[q.id] || "").trim()) count++;
      } else {
        if (selectedAnswers[q.id]) count++;
      }
    }
    return count;
  };

  const handleSubmit = async () => {
    const answeredCount = countAnswered();
    if (answeredCount < questions.length) {
      const confirmSubmit = confirm(
        `You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to submit? Unanswered questions will receive 0 marks.`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    const res = await submitQuizAttemptAction(quiz.id, selectedAnswers, textAnswers);
    setIsSubmitting(false);

    if (res.success && res.score !== undefined) {
      setResult({
        score: res.score,
        totalMarks: res.totalMarks,
        maxTotalMarks: res.maxTotalMarks,
        passed: res.passed!,
        passingScore: res.passingScore!,
        failedAttempts: res.failedAttempts!,
        showExplanations: res.showExplanations!,
        hasPendingAi: res.hasPendingAi,
        questionResults: res.questionResults!,
      });

      if (res.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setTextAnswers({});
    setResult(null);
  };

  const getStatusBadge = (resInfo: any) => {
    if (resInfo?.gradingPending) {
      return (
        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          <Clock className="w-3.5 h-3.5 animate-spin" /> In Review
        </span>
      );
    }

    if (resInfo?.type === "open_ended" && resInfo?.aiResult) {
      const status = resInfo.aiResult.status;
      switch (status) {
        case "correct":
          return (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Correct ({resInfo.score}/{resInfo.maxScore})
            </span>
          );
        case "mostly_correct":
          return (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" /> Almost there ({resInfo.score}/{resInfo.maxScore})
            </span>
          );
        case "partially_correct":
          return (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5" /> Partially correct ({resInfo.score}/{resInfo.maxScore})
            </span>
          );
        default:
          return (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
              <XCircle className="w-3.5 h-3.5" /> Needs improvement ({resInfo.score}/{resInfo.maxScore})
            </span>
          );
      }
    }

    return (
      <span
        className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
          resInfo?.isCorrect
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
        }`}
      >
        {resInfo?.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
        {resInfo?.isCorrect ? "Correct" : "Incorrect"}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Quiz Title Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-blue-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Topic Quiz Check
            </span>
            <h1 className="text-2xl font-bold mt-1">{quiz.title}</h1>
            <p className="text-xs text-slate-300 mt-1">
              Passing Threshold: <span className="font-bold text-white">{quiz.passingScore}%</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Award className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Result Card if Submitted */}
      {result ? (
        <div className="space-y-6">
          <div
            className={`p-6 rounded-2xl border ${
              result.passed
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.passed ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    {result.passed ? "Congratulations! You Passed!" : "Quiz Needs Another Attempt"}
                  </h2>
                  <p className="text-sm opacity-90">
                    Your Score: <span className="font-extrabold">{result.score}%</span>
                    {result.maxTotalMarks && result.maxTotalMarks > 0 && (
                      <span className="ml-1 text-xs opacity-80">
                        ({result.totalMarks} / {result.maxTotalMarks} marks)
                      </span>
                    )}{" "}
                    (Required: {result.passingScore}%)
                  </p>
                </div>
              </div>

              <button
                onClick={handleRetry}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>

            {/* Explanation Unlock Warning Banner */}
            {!result.passed && (
              <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    Failed attempts: <strong className="font-bold">{result.failedAttempts}</strong> / 3 required for detailed explanation unlock.
                  </span>
                </div>
                {result.showExplanations && (
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-300">
                    <Lightbulb className="w-3.5 h-3.5" /> Explanations Unlocked!
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Question Explanations List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Review Questions & Feedback
            </h3>
            {questions.map((q, idx) => {
              const resInfo = result.questionResults.find((r) => r.questionId === q.id);
              const aiResult = resInfo?.aiResult;
              const isAiGraded = q.type === "open_ended" && Boolean(aiResult);

              return (
                <div
                  key={q.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        Q{idx + 1}
                      </span>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {q.question}
                      </p>
                    </div>
                    {getStatusBadge(resInfo)}
                  </div>

                  {/* ── OPEN-ENDED AI FEEDBACK CARD ── */}
                  {q.type === "open_ended" ? (
                    <div className="space-y-3 pt-2">
                      {/* Student's Typed Answer */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Your Answer:
                        </span>
                        <p className="text-slate-800 dark:text-slate-200 italic leading-relaxed">
                          &ldquo;{resInfo?.textAnswer || "No answer provided."}&rdquo;
                        </p>
                      </div>

                      {/* AI Educational Feedback */}
                      {isAiGraded && aiResult && (
                        <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Educational Tutor Feedback:
                          </div>
                          <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                            {aiResult.feedback}
                          </p>

                          {/* Criteria Results Checklist */}
                          {aiResult.criteriaResults && aiResult.criteriaResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/60 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-indigo-800 dark:text-indigo-400">
                                Marking Rubric Criteria:
                              </span>
                              {aiResult.criteriaResults.map((cr: any, cIdx: number) => (
                                <div
                                  key={cIdx}
                                  className="flex items-start justify-between text-xs p-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40"
                                >
                                  <div className="flex items-start gap-2">
                                    {cr.satisfied ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
                                    )}
                                    <div>
                                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                        {cr.criterion}
                                      </p>
                                      <p className="text-[11px] text-slate-500 mt-0.5">
                                        {cr.explanation}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2">
                                    {cr.marksAwarded} / {cr.maxMarks}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Missing Concepts Note */}
                          {aiResult.missingConcepts && aiResult.missingConcepts.length > 0 && (
                            <div className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-2">
                              💡 <strong>Key concepts to remember:</strong>{" "}
                              {aiResult.missingConcepts.join(", ")}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pending AI review banner */}
                      {resInfo?.gradingPending && (
                        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                          <span>
                            Your answer is being evaluated. Your score and feedback will update shortly.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── MULTIPLE CHOICE / TRUE-FALSE DISPLAY ── */
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.answers.map((ans) => {
                        const isSelected = resInfo?.selectedAnswerId === ans.id;
                        const isRight = ans.isCorrect;

                        let style = "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                        if (result.showExplanations && isRight) {
                          style = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-semibold text-emerald-900 dark:text-emerald-200";
                        } else if (isSelected && !isRight) {
                          style = "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200";
                        }

                        return (
                          <div
                            key={ans.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style}`}
                          >
                            <span>{ans.answer}</span>
                            {result.showExplanations && isRight && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Revealed Explanation Banner after 3 failed attempts */}
                  {result.showExplanations && q.explanation && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1 mt-3">
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Detailed Explanation:
                      </p>
                      <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <Link
              href="/dashboard/subjects"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs flex items-center gap-2 hover:bg-blue-700 shadow-md"
            >
              Continue Subject Roadmap
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Questions Interactive Form */
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    Q{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white pt-0.5">
                      {q.question}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {q.maxMarks || 1} {q.maxMarks === 1 ? "mark" : "marks"}
                    </span>
                  </div>
                </div>

                {q.type === "open_ended" && q.aiGradingEnabled && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1 shrink-0">
                    <Brain className="w-3 h-3" /> AI Graded
                  </span>
                )}
              </div>

              {/* ── QUESTION INPUTS ── */}
              {q.type === "open_ended" ? (
                <div className="space-y-2 pl-10">
                  <textarea
                    rows={4}
                    value={textAnswers[q.id] || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Write your explanation in full sentences. Your answer will be evaluated on key concepts and understanding..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Express the concept in your own words. Partial marks are awarded.</span>
                    <span>{(textAnswers[q.id] || "").length} characters</span>
                  </div>
                </div>
              ) : q.type === "short_answer" ? (
                <div className="space-y-2 pl-10">
                  <input
                    type="text"
                    value={textAnswers[q.id] || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              ) : (
                /* Multiple Choice / True-False */
                <div className="space-y-2 pl-10">
                  {q.answers.map((ans) => {
                    const isSelected = selectedAnswers[q.id] === ans.id;
                    return (
                      <button
                        key={ans.id}
                        type="button"
                        onClick={() => handleSelect(q.id, ans.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <span>{ans.answer}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-slate-500 font-medium">
              {countAnswered()} of {questions.length} questions answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? "Evaluating & Grading..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
