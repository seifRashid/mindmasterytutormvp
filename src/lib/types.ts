// ─── Shared TypeScript Types ──────────────────────────────────────────────────
// This file contains ONLY type/interface definitions.
// It has zero runtime data and is safe to import in any production code.

export type UserStatus = "pending" | "approved" | "rejected";
export type AttachmentType = "pdf" | "doc" | "image" | "link" | "presentation" | "other";
export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "open_ended";
export type AiGradingStatus =
  | "correct"
  | "mostly_correct"
  | "partially_correct"
  | "incorrect"
  | "irrelevant"
  | "unclear";

export interface RubricCriterion {
  criterion: string;
  marks: number;
}

export interface CriterionEvaluationResult {
  criterion: string;
  marksAwarded: number;
  maxMarks: number;
  satisfied: boolean;
  explanation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: "student" | "teacher" | "admin";
  phone?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  classId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  notes?: string;
  status?: UserStatus;
  rejectionReason?: string;
  image?: string;
  createdAt: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  classId: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  description: string;
  orderNumber: number;
  createdAt: string;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  type: AttachmentType;
  orderNumber: number;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  richContent?: string;
  videoUrl?: string;
  duration: number;
  orderNumber: number;
  attachments?: LessonAttachment[];
  lessonQuizId?: string;
  status?: "published" | "draft";
  createdAt: string;
}

export interface Quiz {
  id: string;
  topicId?: string;
  lessonId?: string;
  createdBy?: string;
  title: string;
  passingScore: number;
  timeLimitMinutes?: number;
  showFeedback: boolean;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
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
  answers: Answer[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  failedAttempts: number;
  totalMarks?: number;
  maxTotalMarks?: number;
  status?: "completed" | "grading_pending";
  createdAt: string;
}

export interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswerId?: string;
  textAnswer?: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  gradingStatus: "completed" | "pending" | "failed" | "requires_review";
  createdAt: string;
}

export interface AiGradingResult {
  id: string;
  quizAttemptAnswerId: string;
  questionId: string;
  studentId: string;
  score: number;
  maxScore: number;
  status: AiGradingStatus;
  confidence: number;
  criteriaResults: CriterionEvaluationResult[];
  missingConcepts?: string[];
  detectedMisconceptions?: string[];
  feedback: string;
  model: string;
  promptVersion: string;
  requiresTeacherReview: boolean;
  teacherScore?: number;
  teacherFeedback?: string;
  teacherReviewedAt?: string;
  teacherReviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchedDuration: number;
  updatedAt: string;
}
