// ─── Shared TypeScript Types ──────────────────────────────────────────────────
// This file contains ONLY type/interface definitions.
// It has zero runtime data and is safe to import in any production code.

export type UserStatus = "pending" | "approved" | "rejected";
export type AttachmentType = "pdf" | "doc" | "image" | "link" | "presentation" | "other";
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

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
  createdAt: string;
}

export interface Quiz {
  id: string;
  topicId?: string;
  lessonId?: string;
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
  answers: Answer[];
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  failedAttempts: number;
  createdAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  watchedDuration: number;
  updatedAt: string;
}
