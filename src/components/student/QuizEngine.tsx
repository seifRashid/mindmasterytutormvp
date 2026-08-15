"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passingScore: number;
    failedAttempts: number;
    showExplanations: boolean;
    questionResults: {
      questionId: string;
      selectedAnswerId: string;
      correctAnswerId?: string;
      isCorrect: boolean;
      explanation: string;
    }[];
  } | null>(null);

  const handleSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);
    const res = await submitQuizAttemptAction(quiz.id, selectedAnswers);
    setIsSubmitting(false);

    if (res.success && res.score !== undefined) {
      setResult({
        score: res.score,
        passed: res.passed!,
        passingScore: res.passingScore!,
        failedAttempts: res.failedAttempts!,
        showExplanations: res.showExplanations!,
        questionResults: res.questionResults!,
      });

      if (res.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Quiz Title Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border border-blue-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Topic Quiz Check
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
                    Your Score: <span className="font-extrabold">{result.score}%</span> (Required: {result.passingScore}%)
                  </p>
                </div>
              </div>

              <button
                onClick={handleRetry}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
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
              Review Questions
            </h3>
            {questions.map((q, idx) => {
              const resInfo = result.questionResults.find((r) => r.questionId === q.id);
              const isCorrect = resInfo?.isCorrect;

              return (
                <div
                  key={q.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {idx + 1}. {q.question}
                    </p>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isCorrect
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  {/* Answers Display */}
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

                  {/* Revealed Explanation Banner after 3 failed attempts */}
                  {result.showExplanations && (
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
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                  Q{idx + 1}
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white pt-0.5">
                  {q.question}
                </h3>
              </div>

              <div className="space-y-2 pl-10">
                {q.answers.map((ans) => {
                  const isSelected = selectedAnswers[q.id] === ans.id;
                  return (
                    <button
                      key={ans.id}
                      type="button"
                      onClick={() => handleSelect(q.id, ans.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
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
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <span className="text-xs text-slate-500 font-medium">
              {Object.keys(selectedAnswers).length} of {questions.length} questions answered
            </span>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Evaluating Score..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
