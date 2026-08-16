"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  lessonProgress as dbProgress,
  quizAttempts as dbAttempts,
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
  lessons as dbLessons,
  lessonAttachments as dbAttachments,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export async function updateLessonProgressAction(
  lessonId: string,
  updates: {
    watchedDuration?: number;
    notesCompleted?: boolean;
    videoCompleted?: boolean;
    materialsCompleted?: boolean;
  }
) {
  const session = await getSession();
  const userId = session ? session.id : "user-student-1";

  const userUuid = toUuid(userId);
  const lessonUuid = toUuid(lessonId);

  try {
    const existing = await db
      .select()
      .from(dbProgress)
      .where(and(eq(dbProgress.userId, userUuid), eq(dbProgress.lessonId, lessonUuid)));
    
    // Fetch lesson details to know what contents it has
    const [lesson] = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));
    const hasVideo = !!lesson?.videoUrl;
    const hasNotes = !!lesson?.richContent;
    
    // Fetch attachments to check if it has materials
    const attachmentsList = await db
      .select()
      .from(dbAttachments)
      .where(eq(dbAttachments.lessonId, lessonUuid));
    const hasMaterials = attachmentsList.length > 0;

    if (existing.length > 0) {
      const record = existing[0];
      
      const newWatched = updates.watchedDuration !== undefined 
        ? Math.max(record.watchedDuration, updates.watchedDuration)
        : record.watchedDuration;
        
      const newNotes = updates.notesCompleted !== undefined ? updates.notesCompleted : record.notesCompleted;
      const newVideo = updates.videoCompleted !== undefined ? updates.videoCompleted : record.videoCompleted;
      const newMaterials = updates.materialsCompleted !== undefined ? updates.materialsCompleted : record.materialsCompleted;

      // Determine overall completion: all present types must be completed
      const isNotesDone = !hasNotes || newNotes;
      const isVideoDone = !hasVideo || newVideo;
      const isMaterialsDone = !hasMaterials || newMaterials;
      const completedVal = isNotesDone && isVideoDone && isMaterialsDone;

      await db
        .update(dbProgress)
        .set({
          watchedDuration: newWatched,
          notesCompleted: newNotes,
          videoCompleted: newVideo,
          materialsCompleted: newMaterials,
          completed: completedVal,
          updatedAt: new Date(),
        })
        .where(eq(dbProgress.id, record.id));
    } else {
      const newNotes = updates.notesCompleted ?? false;
      const newVideo = updates.videoCompleted ?? false;
      const newMaterials = updates.materialsCompleted ?? false;
      const newWatched = updates.watchedDuration ?? 0;

      // Determine overall completion: all present types must be completed
      const isNotesDone = !hasNotes || newNotes;
      const isVideoDone = !hasVideo || newVideo;
      const isMaterialsDone = !hasMaterials || newMaterials;
      const completedVal = isNotesDone && isVideoDone && isMaterialsDone;

      await db.insert(dbProgress).values({
        userId: userUuid,
        lessonId: lessonUuid,
        completed: completedVal,
        notesCompleted: newNotes,
        videoCompleted: newVideo,
        materialsCompleted: newMaterials,
        watchedDuration: newWatched,
        updatedAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to update lesson progress in database:", err);
    return { success: false, error: "Database update failed." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath("/dashboard/progress");

  // Fetch updated progress for client response
  try {
    const updated = await db
      .select()
      .from(dbProgress)
      .where(and(eq(dbProgress.userId, userUuid), eq(dbProgress.lessonId, lessonUuid)));
    return { success: true, progress: updated[0] };
  } catch {
    return { success: true };
  }
}

export async function submitQuizAttemptAction(
  quizId: string,
  userSelectedAnswers: Record<string, string> // questionId -> answerId
) {
  const session = await getSession();
  const userId = session ? session.id : "user-student-1";

  const userUuid = toUuid(userId);
  const quizUuid = toUuid(quizId);

  // 1. Fetch Quiz and Questions from DB
  let quiz;
  let quizQuestions: any[] = [];
  try {
    const quizResult = await db
      .select()
      .from(dbQuizzes)
      .where(eq(dbQuizzes.id, quizUuid));
    
    if (quizResult.length === 0) {
      return { error: "Quiz not found." };
    }
    quiz = quizResult[0];

    const questionsList = await db
      .select()
      .from(dbQuestions)
      .where(eq(dbQuestions.quizId, quizUuid))
      .orderBy(dbQuestions.orderNumber);

    if (questionsList.length > 0) {
      const questionIds = questionsList.map((q) => q.id);
      const answersList = await db
        .select()
        .from(dbAnswers)
        .where(inArray(dbAnswers.questionId, questionIds));

      quizQuestions = questionsList.map((q) => ({
        ...q,
        answers: answersList.filter((a) => a.questionId === q.id),
      }));
    }
  } catch (err) {
    console.error("Failed to fetch quiz data from DB:", err);
    return { error: "Failed to retrieve quiz details from database." };
  }

  if (quizQuestions.length === 0) {
    return { error: "Quiz questions not found." };
  }

  // 2. Grade the attempt
  let correctCount = 0;
  const questionResults = quizQuestions.map((q) => {
    const selectedAnswerId = userSelectedAnswers[q.id];
    const correctAnswer = q.answers.find((a: any) => a.isCorrect);
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

  const score = Math.round((correctCount / quizQuestions.length) * 100);
  const passed = score >= quiz.passingScore;

  // 3. Track attempt history in DB
  let newFailedAttempts = 0;
  try {
    const pastAttempts = await db
      .select()
      .from(dbAttempts)
      .where(and(eq(dbAttempts.userId, userUuid), eq(dbAttempts.quizId, quizUuid)));

    const previousFailedCount = pastAttempts.reduce(
      (max: number, a: any) => Math.max(max, a.failedAttempts),
      0
    );

    newFailedAttempts = passed ? 0 : previousFailedCount + 1;

    await db.insert(dbAttempts).values({
      userId: userUuid,
      quizId: quizUuid,
      score,
      failedAttempts: newFailedAttempts,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to save quiz attempt in database:", err);
  }

  // Reveal explanations after 3 failed attempts
  const showExplanations = newFailedAttempts >= 3;

  revalidatePath(`/dashboard/quizzes/${quizId}`);
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard");

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

