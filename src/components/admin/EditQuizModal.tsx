"use client";

import { useState } from "react";
import { Edit2, X, Plus, Trash2, ArrowUp, ArrowDown, HelpCircle, Check, AlertCircle } from "lucide-react";
import { editQuizWithQuestionsAction } from "@/actions/admin-actions";

interface Answer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  quizId: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  explanation: string;
  orderNumber: number;
  answers: Answer[];
}

interface QuizData {
  id: string;
  title: string;
  passingScore: number;
}

interface EditQuizModalProps {
  quiz: QuizData;
  initialQuestions: Question[];
}

export function EditQuizModal({ quiz, initialQuestions }: EditQuizModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form States
  const [title, setTitle] = useState(quiz.title);
  const [passingScore, setPassingScore] = useState(quiz.passingScore);
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({ ...a })),
    }))
  );

  const resetForm = () => {
    setTitle(quiz.title);
    setPassingScore(quiz.passingScore);
    setQuestions(
      initialQuestions.map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a })),
      }))
    );
    setError(null);
    setSuccess(false);
  };

  const handleAddQuestion = (type: "multiple_choice" | "true_false" | "short_answer") => {
    const qId = `q-new-${Date.now()}`;
    let answers: Answer[] = [];

    if (type === "true_false") {
      answers = [
        { id: `a-new-${Date.now()}-1`, questionId: qId, answer: "True", isCorrect: true },
        { id: `a-new-${Date.now()}-2`, questionId: qId, answer: "False", isCorrect: false },
      ];
    } else if (type === "multiple_choice") {
      answers = [
        { id: `a-new-${Date.now()}-1`, questionId: qId, answer: "Option A", isCorrect: true },
        { id: `a-new-${Date.now()}-2`, questionId: qId, answer: "Option B", isCorrect: false },
        { id: `a-new-${Date.now()}-3`, questionId: qId, answer: "Option C", isCorrect: false },
        { id: `a-new-${Date.now()}-4`, questionId: qId, answer: "Option D", isCorrect: false },
      ];
    } else {
      answers = [
        { id: `a-new-${Date.now()}-1`, questionId: qId, answer: "Correct Answer", isCorrect: true },
      ];
    }

    const newQuestion: Question = {
      id: qId,
      quizId: quiz.id,
      type,
      question: "",
      explanation: "",
      orderNumber: questions.length + 1,
      answers,
    };

    setQuestions((prev) => [...prev, newQuestion]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    setQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].question = text;
      return updated;
    });
  };

  const handleExplanationChange = (qIndex: number, explanation: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex].explanation = explanation;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!title.trim()) {
      setError("Quiz title is required.");
      setLoading(false);
      return;
    }

    if (questions.length === 0) {
      setError("Quiz must have at least one question.");
      setLoading(false);
      return;
    }

    // Validate each question has content
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setError(`Question #${i + 1} text is empty.`);
        setLoading(false);
        return;
      }

      // Check answers
      const answers = questions[i].answers;
      if (answers.length === 0) {
        setError(`Question #${i + 1} has no answers.`);
        setLoading(false);
        return;
      }

      let hasCorrect = false;
      for (const ans of answers) {
        if (!ans.answer.trim()) {
          setError(`Answer options for Question #${i + 1} cannot be empty.`);
          setLoading(false);
          return;
        }
        if (ans.isCorrect) hasCorrect = true;
      }

      if (!hasCorrect) {
        setError(`Please mark at least one correct option for Question #${i + 1}.`);
        setLoading(false);
        return;
      }
    }

    const res = await editQuizWithQuestionsAction(quiz.id, title, passingScore, questions);

    setLoading(false);
    if (res && res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 1200);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          resetForm();
        }}
        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center justify-center transition-colors"
        title="Edit Quiz & Questions"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl p-6 relative flex flex-col text-left space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                Edit Quiz & Questions Builder
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-880"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl font-medium flex items-center gap-2 flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-2 flex-shrink-0">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Quiz saved successfully!</span>
              </div>
            )}

            {/* Content Scroll Area */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-5">
              
              {/* Quiz Main Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 1 Mastery Check"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Questions Title & Add Question actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Quiz Questions ({questions.length})
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleAddQuestion("multiple_choice")}
                    className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion("true_false")}
                    className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> True/False
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddQuestion("short_answer")}
                    className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Short Answer
                  </button>
                </div>
              </div>

              {/* Empty State */}
              {questions.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No questions added yet. Use the buttons above to build your quiz.</p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl relative space-y-3"
                  >
                    {/* Toolbar */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Question #{qIdx + 1}
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 capitalize">
                          {q.type.replace("_", " ")}
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, "up")}
                          disabled={qIdx === 0}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, "down")}
                          disabled={qIdx === questions.length - 1}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Question Statement *
                      </label>
                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder="Write the question statement here..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Options Form Layout */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Answer Options (Select the correct option) *
                      </label>

                      {q.type === "multiple_choice" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.answers.map((ans, aIdx) => (
                            <div
                              key={ans.id}
                              className={`flex items-center gap-2 p-2 border rounded-xl ${
                                ans.isCorrect
                                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10"
                                  : "border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={ans.isCorrect}
                                onChange={() => handleCorrectAnswerChange(qIdx, aIdx)}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <input
                                type="text"
                                value={ans.answer}
                                onChange={(e) => handleAnswerTextChange(qIdx, aIdx, e.target.value)}
                                placeholder={`Option ${String.fromCharCode(65 + aIdx)}`}
                                className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === "true_false" && (
                        <div className="flex items-center gap-4">
                          {q.answers.map((ans, aIdx) => (
                            <label
                              key={ans.id}
                              className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer ${
                                ans.isCorrect
                                  ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10"
                                  : "border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={ans.isCorrect}
                                onChange={() => handleCorrectAnswerChange(qIdx, aIdx)}
                                className="w-4 h-4 text-emerald-600"
                              />
                              <span className="text-xs text-slate-900 dark:text-white font-semibold">
                                {ans.answer}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === "short_answer" && (
                        <div>
                          {q.answers.map((ans, aIdx) => (
                            <input
                              key={ans.id}
                              type="text"
                              value={ans.answer}
                              onChange={(e) => handleAnswerTextChange(qIdx, aIdx, e.target.value)}
                              placeholder="Type correct answer..."
                              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Explanation
                      </label>
                      <textarea
                        rows={1}
                        value={q.explanation}
                        onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                        placeholder="Write helpful hints or explanations for students..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  {loading ? "Saving..." : "Save Quiz & Questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
