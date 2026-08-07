"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import {
  INITIAL_ATTEMPTS,
  INITIAL_PROGRESS,
  INITIAL_QUESTIONS,
  INITIAL_QUIZZES,
  LessonProgress,
  QuizAttempt,
} from "@/lib/mock-data";

// In-memory data structures for fast interactive testing
const progressStore: LessonProgress[] = [...INITIAL_PROGRESS];
const attemptsStore: QuizAttempt[] = [...INITIAL_ATTEMPTS];

export async function updateLessonProgressAction(
  lessonId: string,
  watchedDuration: number,
  completed: boolean
) {
  const session = await getSession();
  const userId = session ? session.id : "user-student-1";

  const existingIndex = progressStore.findIndex(
    (p) => p.userId === userId && p.lessonId === lessonId
  );

  if (existingIndex > -1) {
    progressStore[existingIndex].watchedDuration = Math.max(
      progressStore[existingIndex].watchedDuration,
      watchedDuration
    );
    if (completed) {
      progressStore[existingIndex].completed = true;
    }
    progressStore[existingIndex].updatedAt = new Date().toISOString();
  } else {
    progressStore.push({
      id: `prog-${Date.now()}`,
      userId,
      lessonId,
      completed,
      watchedDuration,
      updatedAt: new Date().toISOString(),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/lessons/${lessonId}`);
  return { success: true, progress: progressStore.find((p) => p.userId === userId && p.lessonId === lessonId) };
}

export async function submitQuizAttemptAction(
  quizId: string,
  userSelectedAnswers: Record<string, string> // questionId -> answerId
) {
  const session = await getSession();
  const userId = session ? session.id : "user-student-1";

  const quiz = INITIAL_QUIZZES.find((q) => q.id === quizId);
  const questions = INITIAL_QUESTIONS.filter((q) => q.quizId === quizId);

  if (!quiz || questions.length === 0) {
    return { error: "Quiz or questions not found." };
  }

  let correctCount = 0;
  const questionResults = questions.map((q) => {
    const selectedAnswerId = userSelectedAnswers[q.id];
    const correctAnswer = q.answers.find((a) => a.isCorrect);
    const isCorrect = selectedAnswerId === correctAnswer?.id;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      selectedAnswerId,
      correctAnswerId: correctAnswer?.id,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= quiz.passingScore;

  // Track attempt history for this user & quiz
  const pastAttempts = attemptsStore.filter(
    (a) => a.userId === userId && a.quizId === quizId
  );
  const previousFailedCount = pastAttempts.reduce(
    (max, a) => Math.max(max, a.failedAttempts),
    0
  );

  const newFailedAttempts = passed ? 0 : previousFailedCount + 1;

  const newAttempt: QuizAttempt = {
    id: `att-${Date.now()}`,
    userId,
    quizId,
    score,
    failedAttempts: newFailedAttempts,
    createdAt: new Date().toISOString(),
  };

  attemptsStore.push(newAttempt);

  // Reveal explanations after 3 failed attempts
  const showExplanations = newFailedAttempts >= 3;

  revalidatePath(`/dashboard/quizzes/${quizId}`);
  revalidatePath("/dashboard/progress");

  return {
    success: true,
    score,
    passed,
    passingScore: quiz.passingScore,
    failedAttempts: newFailedAttempts,
    showExplanations,
    questionResults,
  };
}
