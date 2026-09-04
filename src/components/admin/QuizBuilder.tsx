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
  Brain,
  Wand2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Key,
  ExternalLink,
} from "lucide-react";
import {
  saveQuizWithQuestionsAction,
  SaveQuizPayload,
  generateMarkingGuideAction,
  testAiGradingAction,
  saveAiConfigAction,
} from "@/actions/admin-actions";
import { RubricCriterion, CriterionEvaluationResult } from "@/lib/types";

export interface AnswerItem {
  id?: string;
  answer: string;
  isCorrect: boolean;
}

export interface QuestionItem {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "open_ended";
  question: string;
  explanation: string;
  orderNumber: number;
  maxMarks?: number;
  aiGradingEnabled?: boolean;
  expectedAnswer?: string;
  keyConcepts?: string[];
  acceptableAnswers?: string[];
  commonMisconceptions?: string[];
  gradingRubric?: RubricCriterion[];
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

  // AI Generation & Preview State (per-question index)
  const [generatingGuideIdx, setGeneratingGuideIdx] = useState<number | null>(null);
  const [generatedGuide, setGeneratedGuide] = useState<{ qIdx: number; guide: any } | null>(null);
  const [testingAiIdx, setTestingAiIdx] = useState<number | null>(null);
  const [sampleAnswers, setSampleAnswers] = useState<Record<number, string>>({});
  const [testPreviews, setTestPreviews] = useState<Record<number, any>>({});
  const [expandedPreviewIdx, setExpandedPreviewIdx] = useState<number | null>(null);

  // AI API Key Setup Modal
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [pendingGuideQIdx, setPendingGuideQIdx] = useState<number | null>(null);

  // Questions State
  const [questions, setQuestions] = useState<QuestionItem[]>(() => {
    if (initialQuestions.length > 0) {
      return initialQuestions.map((q, idx) => ({
        ...q,
        type: q.type || "multiple_choice",
        orderNumber: q.orderNumber || idx + 1,
        maxMarks: q.maxMarks || 1,
        aiGradingEnabled: q.aiGradingEnabled ?? (q.type === "open_ended"),
        expectedAnswer: q.expectedAnswer || "",
        keyConcepts: q.keyConcepts || [],
        acceptableAnswers: q.acceptableAnswers || [],
        commonMisconceptions: q.commonMisconceptions || [],
        gradingRubric: q.gradingRubric || [
          { criterion: "Key Concept Explanation", marks: 2 },
          { criterion: "Supporting Details & Terminology", marks: 2 },
        ],
        answers: q.answers ? q.answers.map((a) => ({ ...a })) : [],
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
        maxMarks: 1,
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

  const handleAddQuestion = (type: "multiple_choice" | "true_false" | "short_answer" | "open_ended") => {
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
    } else if (type === "short_answer") {
      answers = [{ id: `a-${Date.now()}-1`, answer: "", isCorrect: true }];
    } else {
      answers = [];
    }

    const newQuestion: QuestionItem = {
      id: qId,
      type,
      question: "",
      explanation: "",
      orderNumber: questions.length + 1,
      maxMarks: type === "open_ended" ? 4 : 1,
      aiGradingEnabled: type === "open_ended",
      expectedAnswer: "",
      keyConcepts: [""],
      acceptableAnswers: [""],
      commonMisconceptions: [""],
      gradingRubric:
        type === "open_ended"
          ? [
              { criterion: "Key concept explanation", marks: 2 },
              { criterion: "Supporting details and accuracy", marks: 2 },
            ]
          : [],
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

  // AI Grading Configuration Handlers
  const handleAiGradingToggle = (qIndex: number, enabled: boolean) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].aiGradingEnabled = enabled;
      return updated;
    });
  };

  const handleMaxMarksChange = (qIndex: number, marks: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].maxMarks = Math.max(1, marks);
      return updated;
    });
  };

  const handleExpectedAnswerChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].expectedAnswer = text;
      return updated;
    });
  };

  const handleAddConcept = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = updated[qIndex].keyConcepts || [];
      updated[qIndex].keyConcepts = [...list, ""];
      return updated;
    });
  };

  const handleConceptChange = (qIndex: number, cIdx: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = [...(updated[qIndex].keyConcepts || [])];
      list[cIdx] = val;
      updated[qIndex].keyConcepts = list;
      return updated;
    });
  };

  const handleRemoveConcept = (qIndex: number, cIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = (updated[qIndex].keyConcepts || []).filter((_, i) => i !== cIdx);
      updated[qIndex].keyConcepts = list;
      return updated;
    });
  };

  const handleAddAlternative = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = updated[qIndex].acceptableAnswers || [];
      updated[qIndex].acceptableAnswers = [...list, ""];
      return updated;
    });
  };

  const handleAlternativeChange = (qIndex: number, aIdx: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = [...(updated[qIndex].acceptableAnswers || [])];
      list[aIdx] = val;
      updated[qIndex].acceptableAnswers = list;
      return updated;
    });
  };

  const handleRemoveAlternative = (qIndex: number, aIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = (updated[qIndex].acceptableAnswers || []).filter((_, i) => i !== aIdx);
      updated[qIndex].acceptableAnswers = list;
      return updated;
    });
  };

  const handleAddMisconception = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = updated[qIndex].commonMisconceptions || [];
      updated[qIndex].commonMisconceptions = [...list, ""];
      return updated;
    });
  };

  const handleMisconceptionChange = (qIndex: number, mIdx: number, val: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = [...(updated[qIndex].commonMisconceptions || [])];
      list[mIdx] = val;
      updated[qIndex].commonMisconceptions = list;
      return updated;
    });
  };

  const handleRemoveMisconception = (qIndex: number, mIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const list = (updated[qIndex].commonMisconceptions || []).filter((_, i) => i !== mIdx);
      updated[qIndex].commonMisconceptions = list;
      return updated;
    });
  };

  const handleAddRubricCriterion = (qIndex: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const rubric = updated[qIndex].gradingRubric || [];
      updated[qIndex].gradingRubric = [...rubric, { criterion: "", marks: 1 }];
      return updated;
    });
  };

  const handleRubricChange = (
    qIndex: number,
    rIdx: number,
    field: "criterion" | "marks",
    val: string | number
  ) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const rubric = [...(updated[qIndex].gradingRubric || [])];
      if (field === "marks") {
        rubric[rIdx].marks = Math.max(1, parseInt(String(val), 10) || 1);
      } else {
        rubric[rIdx].criterion = String(val);
      }
      updated[qIndex].gradingRubric = rubric;
      return updated;
    });
  };

  const handleRemoveRubricCriterion = (qIndex: number, rIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const rubric = (updated[qIndex].gradingRubric || []).filter((_, i) => i !== rIdx);
      updated[qIndex].gradingRubric = rubric;
      return updated;
    });
  };

  // Generate AI Marking Guide
  const handleGenerateGuide = async (qIndex: number) => {
    const q = questions[qIndex];
    if (!q.question.trim()) {
      alert("Please enter the question statement first.");
      return;
    }

    setGeneratingGuideIdx(qIndex);
    const res = await generateMarkingGuideAction({
      question: q.question,
      maxMarks: q.maxMarks || 4,
      topicId,
    });
    setGeneratingGuideIdx(null);

    if (res.guide) {
      setGeneratedGuide({ qIdx: qIndex, guide: res.guide });
    } else if (res.isConfigured === false) {
      setPendingGuideQIdx(qIndex);
      setShowApiKeyModal(true);
    } else {
      alert(res.error || "Failed to generate marking guide.");
    }
  };

  const handleSaveApiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) {
      alert("Please enter your Google Gemini API Key.");
      return;
    }

    setIsSavingKey(true);
    const res = await saveAiConfigAction({
      apiKey: apiKeyInput.trim(),
      provider: "gemini",
      model: "gemini-1.5-flash",
    });
    setIsSavingKey(false);

    if (res.success) {
      setShowApiKeyModal(false);
      const targetQIdx = pendingGuideQIdx;
      setPendingGuideQIdx(null);
      if (targetQIdx !== null) {
        handleGenerateGuide(targetQIdx);
      } else {
        alert("Google Gemini API Key saved successfully!");
      }
    } else {
      alert(res.error || "Failed to save API key.");
    }
  };

  const handleApplyGuide = (qIndex: number, guide: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        expectedAnswer: guide.expectedAnswer || "",
        keyConcepts: Array.isArray(guide.keyConcepts) && guide.keyConcepts.length > 0 ? [...guide.keyConcepts] : [""],
        acceptableAnswers: Array.isArray(guide.acceptableAnswers) && guide.acceptableAnswers.length > 0 ? [...guide.acceptableAnswers] : [""],
        commonMisconceptions: Array.isArray(guide.commonMisconceptions) && guide.commonMisconceptions.length > 0 ? [...guide.commonMisconceptions] : [""],
        gradingRubric: Array.isArray(guide.rubric) ? guide.rubric.map((r: any) => ({ ...r })) : [],
        maxMarks: guide.maxMarks || updated[qIndex].maxMarks || 4,
      };
      return updated;
    });
    setGeneratedGuide(null);
  };

  // Test AI Grading on sample answer
  const handleTestAi = async (qIndex: number) => {
    const q = questions[qIndex];
    const sample = sampleAnswers[qIndex];

    if (!sample || !sample.trim()) {
      alert("Please enter a sample student answer to test.");
      return;
    }

    if (!q.expectedAnswer?.trim()) {
      alert("Please provide the expected answer first.");
      return;
    }

    setTestingAiIdx(qIndex);
    const res = await testAiGradingAction({
      question: q.question,
      maxMarks: q.maxMarks || 4,
      expectedAnswer: q.expectedAnswer,
      keyConcepts: (q.keyConcepts || []).filter((c) => c.trim()),
      acceptableAnswers: (q.acceptableAnswers || []).filter((a) => a.trim()),
      misconceptions: (q.commonMisconceptions || []).filter((m) => m.trim()),
      rubric: q.gradingRubric || [],
      sampleAnswer: sample.trim(),
      topicId,
    });
    setTestingAiIdx(null);

    if (res.preview) {
      setTestPreviews((prev) => ({ ...prev, [qIndex]: res.preview }));
      setExpandedPreviewIdx(qIndex);
    } else {
      alert(res.error || "Failed to test AI grading.");
    }
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

      if (q.type === "open_ended") {
        if (q.aiGradingEnabled) {
          if (!q.expectedAnswer?.trim()) {
            setError(`Question #${i + 1} has AI Grading enabled. Please provide an Expected Answer.`);
            return;
          }
          if (!q.gradingRubric || q.gradingRubric.length === 0) {
            setError(`Question #${i + 1} must have at least one rubric criterion.`);
            return;
          }
          const rubricTotal = q.gradingRubric.reduce((sum, r) => sum + (Number(r.marks) || 0), 0);
          const maxMarks = q.maxMarks || 1;
          if (rubricTotal !== maxMarks) {
            setError(
              `Question #${i + 1} rubric criteria sum to ${rubricTotal} marks, which must equal the maximum marks (${maxMarks}).`
            );
            return;
          }
        }
      } else {
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
          maxMarks: q.maxMarks || 1,
          aiGradingEnabled: q.type === "open_ended" ? Boolean(q.aiGradingEnabled) : false,
          expectedAnswer: q.expectedAnswer?.trim() || "",
          keyConcepts: (q.keyConcepts || []).filter((c) => c.trim()),
          acceptableAnswers: (q.acceptableAnswers || []).filter((a) => a.trim()),
          commonMisconceptions: (q.commonMisconceptions || []).filter((m) => m.trim()),
          gradingRubric: (q.gradingRubric || []).filter((r) => r.criterion.trim()),
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
            Add multiple choice, true/false, short answer, or AI-graded open-ended questions.
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
          <button
            type="button"
            onClick={() => handleAddQuestion("open_ended")}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> + Open Ended (AI)
          </button>
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-950/20">
          <HelpCircle className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No questions added yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click one of the buttons above to add Multiple Choice, True/False, Short Answer, or Open-Ended questions.
          </p>
        </div>
      )}

      {/* Question Cards List */}
      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div
            key={q.id}
            className={`p-6 bg-white dark:bg-slate-900 border rounded-3xl shadow-sm space-y-4 transition-all ${
              q.type === "open_ended"
                ? "border-purple-200 dark:border-purple-900/50"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            {/* Card Header & Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Question #{qIdx + 1}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize flex items-center gap-1 ${
                    q.type === "open_ended"
                      ? "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {q.type === "open_ended" && <Brain className="w-3 h-3" />}
                  {q.type.replace("_", " ")}
                </span>
                {q.type === "open_ended" && q.aiGradingEnabled && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI Grading Active ({q.maxMarks || 4} marks)
                  </span>
                )}
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

            {/* ── OPEN ENDED QUESTION & AI GRADING SECTION ── */}
            {q.type === "open_ended" ? (
              <div className="space-y-5 pt-2">
                {/* AI Grading Enable Toggle */}
                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-950 dark:text-purple-200">
                        Enable AI Grading
                      </p>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400">
                        Automatically evaluate student responses using semantic rubrics and partial credit.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.aiGradingEnabled ?? true}
                      onChange={(e) => handleAiGradingToggle(qIdx, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {q.aiGradingEnabled && (
                  <div className="space-y-5 pl-2 border-l-2 border-purple-300 dark:border-purple-800 ml-2">
                    {/* Header with Generate Button & Max Marks */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          AI Grading Configuration
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Define reference answer, rubric criteria, and common misconceptions.
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Max Marks:
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={q.maxMarks || 4}
                            onChange={(e) => handleMaxMarksChange(qIdx, parseInt(e.target.value, 10) || 1)}
                            className="w-16 px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white text-center"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleGenerateGuide(qIdx)}
                          disabled={generatingGuideIdx === qIdx}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {generatingGuideIdx === qIdx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Generating Guide...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3.5 h-3.5" />
                              ✨ Generate AI Marking Guide
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Generated Marking Guide Preview Modal / Card */}
                    {generatedGuide && generatedGuide.qIdx === qIdx && (
                      <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                              Generated AI Marking Guide Suggestions
                            </h4>
                          </div>
                          <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold">
                            Review before applying
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-amber-900 dark:text-amber-300">Expected Answer:</span>
                            <p className="mt-1 text-slate-800 dark:text-slate-200 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-200/50">
                              {generatedGuide.guide.expectedAnswer}
                            </p>
                          </div>

                          <div>
                            <span className="font-bold text-amber-900 dark:text-amber-300">Suggested Rubric:</span>
                            <div className="mt-1 space-y-1">
                              {generatedGuide.guide.rubric.map((r: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg text-slate-800 dark:text-slate-200"
                                >
                                  <span>{r.criterion}</span>
                                  <span className="font-bold text-amber-700 dark:text-amber-400">
                                    {r.marks} marks
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                          <button
                            type="button"
                            onClick={() => setGeneratedGuide(null)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
                          >
                            Discard
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateGuide(qIdx)}
                            className="px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Regenerate
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyGuide(qIdx, generatedGuide.guide)}
                            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Apply Generated Guide
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expected / Reference Answer */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Expected Answer (Reference Ideal Answer) <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={q.expectedAnswer || ""}
                        onChange={(e) => handleExpectedAnswerChange(qIdx, e.target.value)}
                        placeholder="e.g. Metals are good conductors because they contain delocalised electrons that can move freely through the metal lattice."
                        className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>

                    {/* Key Concepts */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Key Concepts (Points the student should demonstrate)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddConcept(qIdx)}
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Concept
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(q.keyConcepts || []).map((concept, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={concept}
                              onChange={(e) => handleConceptChange(qIdx, cIdx, e.target.value)}
                              placeholder="e.g. Delocalised electrons carry electrical charge"
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveConcept(qIdx, cIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                              title="Remove concept"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Marking Rubric Table */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Marking Rubric <span className="text-rose-500">*</span>
                          </label>
                          {(() => {
                            const sum = (q.gradingRubric || []).reduce((acc, r) => acc + (Number(r.marks) || 0), 0);
                            const maxMarks = q.maxMarks || 4;
                            const isMatch = sum === maxMarks;
                            return (
                              <span
                                className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isMatch
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                }`}
                              >
                                Total: {sum} / {maxMarks} marks {isMatch ? "✓ Balanced" : "⚠ Sum Mismatch"}
                              </span>
                            );
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddRubricCriterion(qIdx)}
                          className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Add Criterion
                        </button>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="p-2.5">Evaluation Criterion</th>
                              <th className="p-2.5 w-24 text-center">Marks</th>
                              <th className="p-2.5 w-12 text-right"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(q.gradingRubric || []).map((rubricItem, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={rubricItem.criterion}
                                    onChange={(e) =>
                                      handleRubricChange(qIdx, rIdx, "criterion", e.target.value)
                                    }
                                    placeholder="e.g. Explains that electrons are free to move"
                                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    max={q.maxMarks || 10}
                                    value={rubricItem.marks}
                                    onChange={(e) =>
                                      handleRubricChange(qIdx, rIdx, "marks", e.target.value)
                                    }
                                    className="w-16 mx-auto px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-center font-bold"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRubricCriterion(qIdx, rIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Acceptable Alternatives & Misconceptions (Collapsible Advanced Section) */}
                    <details className="group border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs bg-slate-50/50 dark:bg-slate-950/20">
                      <summary className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between">
                        <span>Advanced Semantic Guidance (Alternatives & Misconceptions)</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                      </summary>

                      <div className="space-y-4 pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
                        {/* Alternatives */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                              Acceptable Alternative Expressions:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddAlternative(qIdx)}
                              className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Alternative
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {(q.acceptableAnswers || []).map((alt, aIdx) => (
                              <div key={aIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={alt}
                                  onChange={(e) => handleAlternativeChange(qIdx, aIdx, e.target.value)}
                                  placeholder="e.g. Electricity flows through metals because electrons move easily"
                                  className="flex-1 px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAlternative(qIdx, aIdx)}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Common Misconceptions */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">
                              Common Misconceptions (Incorrect interpretations):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddMisconception(qIdx)}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Misconception
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {(q.commonMisconceptions || []).map((misc, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={misc}
                                  onChange={(e) => handleMisconceptionChange(qIdx, mIdx, e.target.value)}
                                  placeholder="e.g. Protons move through the metal lattice"
                                  className="flex-1 px-3 py-1 text-xs rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMisconception(qIdx, mIdx)}
                                  className="text-slate-400 hover:text-rose-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* 🧪 Test AI Grading Preview Sandbox */}
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Play className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            Test AI Grading Preview
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Verify evaluation before publishing
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={sampleAnswers[qIdx] || ""}
                          onChange={(e) =>
                            setSampleAnswers((prev) => ({ ...prev, [qIdx]: e.target.value }))
                          }
                          placeholder="Type a sample student response to test (e.g. 'Metals have free electrons that can move around')"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestAi(qIdx)}
                          disabled={testingAiIdx === qIdx}
                          className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {testingAiIdx === qIdx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating...
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Test Answer
                            </>
                          )}
                        </button>
                      </div>

                      {/* Preview Results Banner */}
                      {testPreviews[qIdx] && (
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-indigo-900 dark:text-indigo-300 text-sm">
                                Score: {testPreviews[qIdx].score} / {testPreviews[qIdx].maxScore}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  testPreviews[qIdx].status === "correct"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                    : testPreviews[qIdx].status === "mostly_correct"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                }`}
                              >
                                {testPreviews[qIdx].status.replace("_", " ")}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Confidence: {Math.round((testPreviews[qIdx].confidence || 0.85) * 100)}%
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                            💬 <strong>AI Feedback:</strong> {testPreviews[qIdx].feedback}
                          </p>

                          <div className="space-y-1 pt-1">
                            {testPreviews[qIdx].criteriaResults?.map((cr: any, cIdx: number) => (
                              <div
                                key={cIdx}
                                className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400"
                              >
                                <span className="flex items-center gap-1.5">
                                  {cr.satisfied ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-rose-500" />
                                  )}
                                  {cr.criterion}
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {cr.marksAwarded} / {cr.maxMarks} marks
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── STANDARD QUESTIONS (MCQ, TRUE/FALSE, SHORT ANSWER) ── */
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
            )}

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

      {/* AI Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Configure Google Gemini AI Key
                </h3>
                <p className="text-[11px] text-slate-500">
                  Required to generate live, curriculum-aligned marking guides.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <p>
                To enable automated AI marking guides and semantic grading, please provide your Google Gemini API key.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Get a free API key from Google AI Studio
              </a>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Gemini API Key:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setPendingGuideQIdx(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={isSavingKey || !apiKeyInput.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingKey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Save & Generate Guide
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
