"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  Save,
  Clock,
} from "lucide-react";
import { saveQuizWithQuestionsAction, SaveQuizPayload } from "@/actions/admin-actions";

export interface AnswerItem {
  id?: string;
  answer: string;
  isCorrect: boolean;
}

export interface QuestionItem {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  explanation: string;
  orderNumber: number;
  answers: AnswerItem[];
}

export interface QuizTopicOption {
  id: string;
  title: string;
  subjectTitle?: string;
  className?: string;
}

interface QuizBuilderProps {
  initialQuiz?: {
    id?: string;
    topicId?: string | null;
    lessonId?: string | null;
    title?: string;
    passingScore?: number;
    timeLimitMinutes?: number;
    showFeedback?: boolean;
  };
  initialQuestions?: QuestionItem[];
  topics: QuizTopicOption[];
  role?: "admin" | "teacher";
  isEditing?: boolean;
}

export function QuizBuilder({
  initialQuiz,
  initialQuestions = [],
  topics = [],
  role = "admin",
  isEditing = false,
}: QuizBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialQuiz?.title || "");
  const [topicId, setTopicId] = useState(initialQuiz?.topicId || topics[0]?.id || "");
  const [passingScore, setPassingScore] = useState(initialQuiz?.passingScore ?? 70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialQuiz?.timeLimitMinutes ?? 0);
  const [showFeedback, setShowFeedback] = useState(initialQuiz?.showFeedback ?? true);

  // Questions State
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    if (initialQuestions.length > 0) {
      return initialQuestions.map((q, idx) => ({
        ...q,
        orderNumber: q.orderNumber || idx + 1,
        answers: q.answers.map((a) => ({ ...a })),
      }));
    }
    // Default starting question for a new quiz
    return [
      {
        id: `q-${Date.now()}-1`,
        type: "multiple_choice",
        question: "",
        explanation: "",
        orderNumber: 1,
        answers: [
          { id: `a-${Date.now()}-1`, answer: "", isCorrect: true },
          { id: `a-${Date.now()}-2`, answer: "", isCorrect: false },
          { id: `a-${Date.now()}-3`, answer: "", isCorrect: false },
          { id: `a-${Date.now()}-4`, answer: "", isCorrect: false },
        ],
      },
    ];
  });

  const listUrl = role === "teacher" ? "/teacher/quizzes" : "/admin/quizzes";

  const handleAddQuestion = (type: "multiple_choice" | "true_false" | "short_answer") => {
    const qId = `q-${Date.now()}-${questions.length + 1}`;
    let answers: AnswerItem[] = [];

    if (type === "true_false") {
      answers = [
        { id: `a-${Date.now()}-1`, answer: "True", isCorrect: true },
        { id: `a-${Date.now()}-2`, answer: "False", isCorrect: false },
      ];
    } else if (type === "multiple_choice") {
      answers = [
        { id: `a-${Date.now()}-1`, answer: "", isCorrect: true },
        { id: `a-${Date.now()}-2`, answer: "", isCorrect: false },
        { id: `a-${Date.now()}-3`, answer: "", isCorrect: false },
        { id: `a-${Date.now()}-4`, answer: "", isCorrect: false },
      ];
    } else {
      answers = [
        { id: `a-${Date.now()}-1`, answer: "", isCorrect: true },
      ];
    }

    const newQuestion: QuestionItem = {
      id: qId,
      type,
      question: "",
      explanation: "",
      orderNumber: questions.length + 1,
      answers,
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions((prev) => {
      const filtered = prev.filter((_, idx) => idx !== qIndex);
      return filtered.map((q, idx) => ({ ...q, orderNumber: idx + 1 }));
    });
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    setQuestions(updated.map((q, idx) => ({ ...q, orderNumber: idx + 1 })));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].question = text;
      return updated;
    });
  };

  const handleExplanationChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].explanation = text;
      return updated;
    });
  };

  const handleAnswerTextChange = (qIndex: number, aIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].answers[aIndex].answer = text;
      return updated;
    });
  };

  const handleCorrectAnswerChange = (qIndex: number, correctAIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].answers = updated[qIndex].answers.map((ans, idx) => ({
        ...ans,
        isCorrect: idx === correctAIdx,
      }));
      return updated;
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("Please enter a title for the quiz.");
      return;
    }

    if (!topicId) {
      setError("Please select a parent topic for this quiz.");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question to the quiz.");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question #${i + 1} statement cannot be empty.`);
        return;
      }

      if (q.answers.length === 0) {
        setError(`Question #${i + 1} must have at least one answer option.`);
        return;
      }

      let hasCorrect = false;
      for (const ans of q.answers) {
        if (!ans.answer.trim()) {
          setError(`Answer options for Question #${i + 1} cannot be empty.`);
          return;
        }
        if (ans.isCorrect) hasCorrect = true;
      }

      if (!hasCorrect) {
        setError(`Please mark at least one correct answer for Question #${i + 1}.`);
        return;
      }
    }

    startTransition(async () => {
      const payload: SaveQuizPayload = {
        id: initialQuiz?.id,
        topicId,
        lessonId: initialQuiz?.lessonId,
        title: title.trim(),
        passingScore,
        timeLimitMinutes,
        showFeedback,
        questions: questions.map((q, idx) => ({
          id: q.id,
          type: q.type,
          question: q.question.trim(),
          explanation: q.explanation.trim(),
          orderNumber: idx + 1,
          answers: q.answers.map((a) => ({
            id: a.id,
            answer: a.answer.trim(),
            isCorrect: a.isCorrect,
          })),
        })),
      };

      const res = await saveQuizWithQuestionsAction(payload);

      if (res && res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => {
          router.push(listUrl);
        }, 800);
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href={listUrl}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Back to Quizzes List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {isEditing ? "Quiz Editor" : "Quiz Authoring"}
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              {isEditing ? "Edit Quiz & Questions" : "Create New Quiz"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={listUrl}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Quiz...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? "Save Changes" : "Publish Quiz"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-2xl font-semibold flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-2xl font-semibold flex items-center gap-2.5 shadow-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Quiz saved successfully! Redirecting to quizzes list...</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quiz Details & Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Quiz Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Quiz Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Equations Mastery Check"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
          </div>

          {/* Parent Topic Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Parent Topic <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all appearance-none cursor-pointer"
              >
                {topics.length === 0 && <option value="">No topics available</option>}
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.subjectTitle ? `(${t.subjectTitle})` : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                ▼
              </div>
            </div>
          </div>

          {/* Passing Score */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Passing Score (%) <span className="text-slate-400 font-normal">(Min 10%, Max 100%)</span>
            </label>
            <input
              type="number"
              min="10"
              max="100"
              required
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Time Limit (Minutes) <span className="text-slate-400 font-normal">(0 for unlimited)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="180"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 0)}
                placeholder="0 = Unlimited"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
              />
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Instant Feedback Toggle */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Instant Feedback & Hints</p>
            <p className="text-[11px] text-slate-500">
              Reveal explanations and answer tips after students submit quiz attempts.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showFeedback}
              onChange={(e) => setShowFeedback(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Questions Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Quiz Questions
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-xs">
              {questions.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add multiple choice, true/false, or short answer questions for this quiz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleAddQuestion("multiple_choice")}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Multiple Choice
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion("true_false")}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" /> True / False
          </button>
          <button
            type="button"
            onClick={() => handleAddQuestion("short_answer")}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" /> Short Answer
          </button>
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/20">
          <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No questions added yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click one of the buttons above to add Multiple Choice, True/False, or Short Answer questions.
          </p>
        </div>
      )}

      {/* Question Cards List */}
      <div className="space-y-5">
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 transition-all"
          >
            {/* Card Header & Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Question #{qIdx + 1}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 capitalize">
                  {q.type.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMoveQuestion(qIdx, "up")}
                  disabled={qIdx === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveQuestion(qIdx, "down")}
                  disabled={qIdx === questions.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Statement */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Question Statement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={q.question}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                placeholder="Type the question statement here..."
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium transition-all"
              />
            </div>

            {/* Answer Options Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Answer Options (Select the correct answer option) <span className="text-rose-500">*</span>
              </label>

              {/* Multiple Choice */}
              {q.type === "multiple_choice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.answers.map((ans, aIdx) => (
                    <div
                      key={ans.id || aIdx}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        ans.isCorrect
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20 ring-1 ring-emerald-500/40"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={ans.isCorrect}
                        onChange={() => handleCorrectAnswerChange(qIdx, aIdx)}
                        className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        value={ans.answer}
                        onChange={(e) => handleAnswerTextChange(qIdx, aIdx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + aIdx)}`}
                        className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white font-medium focus:outline-none placeholder-slate-400"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* True / False */}
              {q.type === "true_false" && (
                <div className="flex items-center gap-4">
                  {q.answers.map((ans, aIdx) => (
                    <label
                      key={ans.id || aIdx}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border cursor-pointer transition-all ${
                        ans.isCorrect
                          ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={ans.isCorrect}
                        onChange={() => handleCorrectAnswerChange(qIdx, aIdx)}
                        className="w-4 h-4 text-emerald-600 accent-emerald-600"
                      />
                      <span className="text-xs text-slate-900 dark:text-white font-semibold">
                        {ans.answer}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer */}
              {q.type === "short_answer" && (
                <div>
                  {q.answers.map((ans, aIdx) => (
                    <div key={ans.id || aIdx} className="space-y-1">
                      <input
                        type="text"
                        value={ans.answer}
                        onChange={(e) => handleAnswerTextChange(qIdx, aIdx, e.target.value)}
                        placeholder="Type expected correct answer keywords..."
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Students must provide this exact or equivalent text answer to score marks.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explanation & Feedback */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Explanation & Learning Hints
              </label>
              <textarea
                rows={1}
                value={q.explanation}
                onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                placeholder="Add step-by-step notes or hints to help students learn after attempting this question..."
                className="w-full px-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-end gap-3 pt-6 pb-12 border-t border-slate-200 dark:border-slate-800">
        <Link
          href={listUrl}
          className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Quiz...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Save Changes" : "Publish Quiz"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
