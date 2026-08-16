"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upsertLessonAction } from "@/actions/teacher-actions";
import {
  FileText,
  Video,
  Paperclip,
  HelpCircle,
  Plus,
  Trash2,
  GripVertical,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  File,
  Image as ImageIcon,
  Presentation,
  Clock,
  BookOpen,
  Settings2,
} from "lucide-react";
import type { Lesson, LessonAttachment, Quiz, Question, Answer, AttachmentType, QuestionType } from "@/lib/types";

import { RichTextEditor } from "@/components/editor/RichTextEditor";

type Tab = "content" | "video" | "materials" | "quiz";

interface LessonBuilderProps {
  lesson: Lesson;
  quiz?: Quiz;
  questions?: Question[];
  topics?: { id: string; title: string }[];
  onSave?: (data: Partial<Lesson>) => void;
}

const ATTACHMENT_TYPE_ICONS: Record<AttachmentType, React.ElementType> = {
  pdf: File,
  doc: FileText,
  image: ImageIcon,
  link: LinkIcon,
  presentation: Presentation,
  other: Paperclip,
};

const ATTACHMENT_TYPE_COLORS: Record<AttachmentType, string> = {
  pdf: "text-rose-500 bg-rose-50 dark:bg-rose-950/40",
  doc: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
  image: "text-violet-500 bg-violet-50 dark:bg-violet-950/40",
  link: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40",
  presentation: "text-amber-500 bg-amber-50 dark:bg-amber-950/40",
  other: "text-slate-500 bg-slate-50 dark:bg-slate-900",
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  short_answer: "Short Answer",
};

function QuestionCard({
  q,
  index,
  onChange,
  onDelete,
}: {
  q: Question;
  index: number;
  onChange: (updated: Question) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateAnswer = (aIdx: number, field: Partial<Answer>) => {
    const updated = q.answers.map((a, i) => (i === aIdx ? { ...a, ...field } : a));
    onChange({ ...q, answers: updated });
  };

  const markCorrect = (aIdx: number) => {
    const updated = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIdx }));
    onChange({ ...q, answers: updated });
  };

  const addMcqOption = () => {
    if (q.answers.length >= 4) return;
    onChange({
      ...q,
      answers: [
        ...q.answers,
        { id: `new-${Date.now()}`, questionId: q.id, answer: "", isCorrect: false },
      ],
    });
  };

  const removeAnswer = (aIdx: number) => {
    onChange({ ...q, answers: q.answers.filter((_, i) => i !== aIdx) });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
          <span className="text-xs font-bold text-slate-500">Q{index + 1}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
            {QUESTION_TYPE_LABELS[q.type]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question type selector */}
          <div className="flex gap-2 flex-wrap">
            {(["multiple_choice", "true_false", "short_answer"] as QuestionType[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  let answers: Answer[] = [];
                  if (t === "true_false") {
                    answers = [
                      { id: `${q.id}-t`, questionId: q.id, answer: "True", isCorrect: true },
                      { id: `${q.id}-f`, questionId: q.id, answer: "False", isCorrect: false },
                    ];
                  } else if (t === "multiple_choice") {
                    answers = [
                      { id: `${q.id}-a1`, questionId: q.id, answer: "", isCorrect: true },
                      { id: `${q.id}-a2`, questionId: q.id, answer: "", isCorrect: false },
                    ];
                  } else {
                    answers = [{ id: `${q.id}-sa`, questionId: q.id, answer: "", isCorrect: true }];
                  }
                  onChange({ ...q, type: t, answers });
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                  q.type === t
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-blue-400"
                }`}
              >
                {QUESTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Question text */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Question</label>
            <textarea
              value={q.question}
              onChange={(e) => onChange({ ...q, question: e.target.value })}
              rows={2}
              placeholder="Enter the question..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Answers */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              {q.type === "multiple_choice"
                ? "Answer Options (check the correct one)"
                : q.type === "true_false"
                ? "Select the correct answer"
                : "Correct Answer"}
            </label>

            <div className="space-y-2">
              {q.answers.map((a, aIdx) => (
                <div key={a.id} className="flex items-center gap-2">
                  {/* Correct indicator */}
                  <button
                    onClick={() => markCorrect(aIdx)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      a.isCorrect
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 dark:border-slate-600 hover:border-emerald-400"
                    }`}
                  >
                    {a.isCorrect && <Check className="w-3 h-3" />}
                  </button>

                  {q.type === "true_false" ? (
                    <span className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                      {a.answer}
                    </span>
                  ) : q.type === "short_answer" ? (
                    <input
                      value={a.answer}
                      onChange={(e) => updateAnswer(aIdx, { answer: e.target.value })}
                      placeholder="Type the correct answer..."
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <>
                      <input
                        value={a.answer}
                        onChange={(e) => updateAnswer(aIdx, { answer: e.target.value })}
                        placeholder={`Option ${aIdx + 1}`}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {q.answers.length > 2 && (
                        <button
                          onClick={() => removeAnswer(aIdx)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {q.type === "multiple_choice" && q.answers.length < 4 && (
              <button
                onClick={addMcqOption}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Explanation <span className="text-slate-400 font-normal">(shown after wrong attempts)</span>
            </label>
            <textarea
              value={q.explanation}
              onChange={(e) => onChange({ ...q, explanation: e.target.value })}
              rows={2}
              placeholder="Explain why the correct answer is right..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function LessonBuilder({ lesson, quiz, questions: initialQuestions, topics }: LessonBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Content tab state
  const [title, setTitle] = useState(lesson.title);
  const [topicId, setTopicId] = useState(lesson.topicId);
  const [description, setDescription] = useState(lesson.description);
  const [richContent, setRichContent] = useState(lesson.richContent ?? "");
  const [status, setStatus] = useState<"published" | "draft">(lesson.status ?? "published");

  // Video tab state
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");
  const [duration, setDuration] = useState(String(Math.floor(lesson.duration / 60)));

  // Materials tab state
  const [attachments, setAttachments] = useState<LessonAttachment[]>(lesson.attachments ?? []);
  const [newAttName, setNewAttName] = useState("");
  const [newAttUrl, setNewAttUrl] = useState("");
  const [newAttType, setNewAttType] = useState<AttachmentType>("pdf");

  // Quiz tab state
  const [hasQuiz, setHasQuiz] = useState(!!lesson.lessonQuizId);
  const [quizTitle, setQuizTitle] = useState(quiz?.title ?? `Quick Check: ${lesson.title}`);
  const [passingScore, setPassingScore] = useState(quiz?.passingScore ?? 60);
  const [timeLimit, setTimeLimit] = useState(quiz?.timeLimitMinutes ?? 5);
  const [showFeedback, setShowFeedback] = useState(quiz?.showFeedback ?? true);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(initialQuestions ?? []);

  const addAttachment = () => {
    if (!newAttName.trim() || !newAttUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-new-${Date.now()}`,
        lessonId: lesson.id,
        name: newAttName,
        url: newAttUrl,
        type: newAttType,
        orderNumber: prev.length + 1,
      },
    ]);
    setNewAttName("");
    setNewAttUrl("");
    setNewAttType("pdf");
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const addQuestion = (type: QuestionType) => {
    const id = `q-new-${Date.now()}`;
    let answers: Answer[] = [];
    if (type === "true_false") {
      answers = [
        { id: `${id}-t`, questionId: id, answer: "True", isCorrect: true },
        { id: `${id}-f`, questionId: id, answer: "False", isCorrect: false },
      ];
    } else if (type === "multiple_choice") {
      answers = [
        { id: `${id}-a1`, questionId: id, answer: "", isCorrect: true },
        { id: `${id}-a2`, questionId: id, answer: "", isCorrect: false },
        { id: `${id}-a3`, questionId: id, answer: "", isCorrect: false },
      ];
    } else {
      answers = [{ id: `${id}-sa`, questionId: id, answer: "", isCorrect: true }];
    }
    setQuizQuestions((prev) => [
      ...prev,
      {
        id,
        quizId: quiz?.id ?? "new",
        type,
        question: "",
        explanation: "",
        orderNumber: prev.length + 1,
        answers,
      },
    ]);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await upsertLessonAction(lesson.id, {
        topicId,
        title,
        description,
        richContent,
        videoUrl,
        duration: Number(duration) * 60 || 0,
        status,
        attachments: attachments.map((a) => ({
          name: a.name,
          url: a.url,
          type: a.type,
          orderNumber: a.orderNumber,
        })),
        quiz: hasQuiz
          ? {
              title: quizTitle,
              passingScore,
              timeLimitMinutes: timeLimit,
              showFeedback,
              questions: quizQuestions.map((q) => ({
                id: q.id,
                type: q.type,
                question: q.question,
                explanation: q.explanation,
                orderNumber: q.orderNumber,
                answers: q.answers.map((a) => ({
                  answer: a.answer,
                  isCorrect: a.isCorrect,
                })),
              })),
            }
          : undefined,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert(result.error || "Failed to save lesson");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving the lesson.");
    } finally {
      setIsSaving(false);
    }
  }, [
    lesson.id,
    topicId,
    title,
    description,
    richContent,
    videoUrl,
    duration,
    status,
    attachments,
    hasQuiz,
    quizTitle,
    passingScore,
    timeLimit,
    showFeedback,
    quizQuestions,
  ]);

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "content", label: "📖 Notes", icon: FileText },
    { key: "video", label: "🎬 Video", icon: Video },
    { key: "materials", label: "📎 Materials", icon: Paperclip },
    { key: "quiz", label: "✏️ Quiz", icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lesson Builder</p>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 line-clamp-2">
            {title || "Untitled Lesson"}
          </h1>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-center">
          {/* Status select dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Status:
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "published" | "draft")}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="published">🟢 Published</option>
              <option value="draft">🟡 Draft</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30 active:scale-95"
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : isSaving ? (
              "Saving..."
            ) : (
              "Save Lesson"
            )}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: CONTENT ────────────────────────────────────────────── */}
      {activeTab === "content" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Lesson Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive lesson title..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            {topics && topics.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Target Topic *
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                Short Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary shown in lesson listings..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Lesson Notes (Rich Text)
            </label>
            <RichTextEditor
              value={richContent}
              onChange={(val) => setRichContent(val)}
              placeholder="Start typing formatted lesson notes..."
              minHeight={450}
            />
          </div>
        </div>
      )}

      {/* ── TAB: VIDEO ──────────────────────────────────────────────── */}
      {activeTab === "video" && (
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Video Settings</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Video Embed URL
              </label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                YouTube: use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/embed/VIDEO_ID</code> format.
                Works with YouTube, Vimeo, and other embeddable video platforms.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="0"
                className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Live Preview */}
          {videoUrl && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</p>
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl aspect-video">
                <iframe
                  src={videoUrl}
                  title="Video preview"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {!videoUrl && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
              <Video className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Enter a video URL above to preview</p>
              <p className="text-xs mt-1">Leave empty to create a notes-only lesson</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MATERIALS ──────────────────────────────────────────── */}
      {activeTab === "materials" && (
        <div className="space-y-5">
          {/* Add new attachment */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Add Learning Material</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Material Name</label>
                <input
                  value={newAttName}
                  onChange={(e) => setNewAttName(e.target.value)}
                  placeholder="e.g. Chapter 3 Worksheet"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">File Type</label>
                <select
                  value={newAttType}
                  onChange={(e) => setNewAttType(e.target.value as AttachmentType)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(["pdf", "doc", "image", "link", "presentation", "other"] as AttachmentType[]).map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">File URL / Link</label>
              <div className="flex gap-2">
                <input
                  value={newAttUrl}
                  onChange={(e) => setNewAttUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addAttachment}
                  disabled={!newAttName.trim() || !newAttUrl.trim()}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Existing attachments */}
          {attachments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {attachments.length} Material{attachments.length > 1 ? "s" : ""}
              </p>
              {attachments.map((att) => {
                const Icon = ATTACHMENT_TYPE_ICONS[att.type];
                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                  >
                    <div className={`p-2 rounded-lg ${ATTACHMENT_TYPE_COLORS[att.type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{att.name}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{att.url}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                      {att.type}
                    </span>
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
              <Paperclip className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">No materials added yet</p>
              <p className="text-xs mt-1">Add PDFs, worksheets, links, or images above</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: QUIZ ───────────────────────────────────────────────── */}
      {activeTab === "quiz" && (
        <div className="space-y-5">
          {/* Quiz toggle + settings */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Quiz Settings</h2>
              </div>
              {/* Toggle */}
              <button
                onClick={() => setHasQuiz(!hasQuiz)}
                className={`relative w-11 h-6 rounded-full transition-all ${
                  hasQuiz ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    hasQuiz ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {hasQuiz && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Quiz Title</label>
                  <input
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      min={0} max={100}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Time Limit (min)
                    </label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">0 = no time limit</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Show Feedback</label>
                    <button
                      onClick={() => setShowFeedback(!showFeedback)}
                      className={`relative w-11 h-6 rounded-full transition-all mt-1 ${
                        showFeedback ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          showFeedback ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!hasQuiz && (
              <p className="text-sm text-slate-400 text-center py-4">
                Enable the quiz to add questions and assess students after this lesson.
              </p>
            )}
          </div>

          {/* Questions */}
          {hasQuiz && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {quizQuestions.length} Question{quizQuestions.length !== 1 ? "s" : ""}
                </p>
                {/* Add question buttons */}
                <div className="flex gap-2 flex-wrap">
                  {(["multiple_choice", "true_false", "short_answer"] as QuestionType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => addQuestion(t)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {QUESTION_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {quizQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                  <HelpCircle className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">No questions yet</p>
                  <p className="text-xs mt-1">Add questions using the buttons above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      index={idx}
                      onChange={(updated) =>
                        setQuizQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                      }
                      onDelete={() =>
                        setQuizQuestions((prev) => prev.filter((x) => x.id !== q.id))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
