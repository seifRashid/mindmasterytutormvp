"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lessons as dbLessons, lessonAttachments, quizzes, questions, answers } from "@/db/schema";
import { eq, and, lt, isNotNull, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

import { getSession } from "@/lib/auth";

/**
 * Automatically purge lessons from the recycle bin that were deleted more than 2 days (48 hours) ago.
 */
export async function purgeExpiredRecycleBin() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // 2 days ago

    await db
      .delete(dbLessons)
      .where(and(isNotNull(dbLessons.deletedAt), lt(dbLessons.deletedAt, cutoff)));
  } catch (err) {
    console.error("Failed to purge expired lessons from recycle bin:", err);
  }
}

/**
 * Soft deletes a lesson by setting its deletedAt timestamp.
 * Teachers can only delete lessons created by themselves; admins have full rights.
 */
export async function softDeleteLessonAction(lessonId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const lessonUuid = toUuid(lessonId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only delete lessons created by themselves." };
      }
    }

    await db
      .update(dbLessons)
      .set({ deletedAt: new Date() })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    revalidatePath(`/dashboard/lessons/${lessonUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to soft delete lesson:", err);
    return { success: false, error: "Failed to delete lesson." };
  }
}

/**
 * Restores a soft-deleted lesson by nullifying its deletedAt timestamp.
 * Teachers can only restore lessons created by themselves; admins have full rights.
 */
export async function restoreLessonAction(lessonId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const lessonUuid = toUuid(lessonId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only restore lessons created by themselves." };
      }
    }

    await db
      .update(dbLessons)
      .set({ deletedAt: null })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    revalidatePath(`/dashboard/lessons/${lessonUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to restore lesson:", err);
    return { success: false, error: "Failed to restore lesson." };
  }
}

/**
 * Permanently deletes a lesson from the database.
 * Teachers can only permanently delete lessons created by themselves; admins have full rights.
 */
export async function permanentlyDeleteLessonAction(lessonId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const lessonUuid = toUuid(lessonId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only permanently delete lessons created by themselves." };
      }
    }

    await db.delete(dbLessons).where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    revalidatePath(`/dashboard/lessons/${lessonUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to permanently delete lesson:", err);
    return { success: false, error: "Failed to permanently delete lesson." };
  }
}

import { INITIAL_QUIZZES, INITIAL_QUESTIONS } from "@/lib/mock-data";

/**
 * Automatically purge quizzes from the recycle bin that were deleted more than 30 days (1 month) ago.
 */
export async function purgeExpiredRecycleBinQuizzes() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // 30 days ago (1 month)

    await db
      .delete(quizzes)
      .where(and(isNotNull(quizzes.deletedAt), lt(quizzes.deletedAt, cutoff)));
  } catch (err) {
    console.error("Failed to purge expired quizzes from recycle bin:", err);
  }
}

/**
 * Soft deletes a quiz by setting its deletedAt timestamp.
 * Teachers can only delete quizzes created by themselves; admins have full rights.
 */
export async function softDeleteQuizAction(quizId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const quizUuid = toUuid(quizId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(quizzes).where(eq(quizzes.id, quizUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only delete quizzes created by themselves." };
      }
    }

    await db
      .update(quizzes)
      .set({ deletedAt: new Date() })
      .where(eq(quizzes.id, quizUuid));

    const mockIdx = INITIAL_QUIZZES.findIndex((q) => q.id === quizId);
    if (mockIdx > -1) {
      (INITIAL_QUIZZES[mockIdx] as any).deletedAt = new Date().toISOString();
    }

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/quizzes/${quizId}`);
    revalidatePath(`/dashboard/quizzes/${quizUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to soft delete quiz:", err);
    return { success: false, error: "Failed to delete quiz." };
  }
}

/**
 * Restores a soft-deleted quiz by nullifying its deletedAt timestamp.
 * Teachers can only restore quizzes created by themselves; admins have full rights.
 */
export async function restoreQuizAction(quizId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const quizUuid = toUuid(quizId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(quizzes).where(eq(quizzes.id, quizUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only restore quizzes created by themselves." };
      }
    }

    await db
      .update(quizzes)
      .set({ deletedAt: null })
      .where(eq(quizzes.id, quizUuid));

    const mockIdx = INITIAL_QUIZZES.findIndex((q) => q.id === quizId);
    if (mockIdx > -1) {
      (INITIAL_QUIZZES[mockIdx] as any).deletedAt = undefined;
    }

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/quizzes/${quizId}`);
    revalidatePath(`/dashboard/quizzes/${quizUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to restore quiz:", err);
    return { success: false, error: "Failed to restore quiz." };
  }
}

/**
 * Permanently deletes a quiz from the database.
 * Teachers can only permanently delete quizzes created by themselves; admins have full rights.
 */
export async function permanentlyDeleteQuizAction(quizId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in." };
    }

    const quizUuid = toUuid(quizId);

    // Permission check for teachers
    if (session.role !== "admin") {
      const existing = await db.select().from(quizzes).where(eq(quizzes.id, quizUuid));
      const userUuid = toUuid(session.id);
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only permanently delete quizzes created by themselves." };
      }
    }

    await db.delete(quizzes).where(eq(quizzes.id, quizUuid));

    const mockIdx = INITIAL_QUIZZES.findIndex((q) => q.id === quizId);
    if (mockIdx > -1) {
      INITIAL_QUIZZES.splice(mockIdx, 1);
    }
    const qIdsToDelete = INITIAL_QUESTIONS.filter((q) => q.quizId === quizId).map((q) => q.id);
    for (const qId of qIdsToDelete) {
      const qIdx = INITIAL_QUESTIONS.findIndex((q) => q.id === qId);
      if (qIdx > -1) INITIAL_QUESTIONS.splice(qIdx, 1);
    }

    revalidatePath("/teacher/quizzes");
    revalidatePath("/admin/quizzes");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");
    revalidatePath(`/dashboard/quizzes/${quizId}`);
    revalidatePath(`/dashboard/quizzes/${quizUuid}`);
    return { success: true };
  } catch (err) {
    console.error("Failed to permanently delete quiz:", err);
    return { success: false, error: "Failed to permanently delete quiz." };
  }
}

import { formatVideoEmbedUrl } from "@/lib/video-utils";

/**
 * Creates or updates a lesson, including its status, attachments, and inline quizzes.
 */
export async function upsertLessonAction(
  lessonId: string,
  data: {
    topicId: string;
    title: string;
    description: string;
    richContent: string;
    videoUrl?: string;
    duration: number;
    status: "published" | "draft";
    attachments: Array<{ name: string; url: string; type: string; orderNumber: number }>;
    quiz?: {
      title: string;
      passingScore: number;
      timeLimitMinutes: number;
      showFeedback: boolean;
      questions: Array<{
        id: string;
        type: "multiple_choice" | "true_false" | "short_answer" | "open_ended";
        question: string;
        explanation?: string;
        orderNumber: number;
        answers: Array<{ answer: string; isCorrect: boolean }>;
      }>;
    };
  }
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized: You must be logged in to create or edit lessons." };
    }
    const userUuid = session.id ? toUuid(session.id) : null;
    const lessonUuid = toUuid(lessonId);
    const topicUuid = data.topicId ? toUuid(data.topicId) : null;
    const formattedVideo = formatVideoEmbedUrl(data.videoUrl);

    // 1. Check if lesson already exists in database
    const existing = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));

    // Permission check for updating existing lesson
    if (existing.length > 0 && session.role !== "admin") {
      if (existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { success: false, error: "Unauthorized: Teachers can only edit lessons created by themselves." };
      }
    }

    let lessonQuizId: string | null = null;
    if (existing.length > 0 && existing[0].lessonQuizId) {
      lessonQuizId = existing[0].lessonQuizId;
    } else {
      // Check if a quiz exists referencing this lesson
      const existingQuiz = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonUuid));
      if (existingQuiz.length > 0) {
        lessonQuizId = existingQuiz[0].id;
      }
    }

    // 2. IMPORTANT: Upsert Lesson row FIRST!
    // This ensures lessons.id exists in the database so foreign keys in quizzes and lesson_attachments succeed.
    if (existing.length > 0) {
      await db
        .update(dbLessons)
        .set({
          topicId: topicUuid!,
          title: data.title,
          description: data.description,
          richContent: data.richContent,
          videoUrl: formattedVideo || null,
          duration: data.duration,
          status: data.status,
          createdBy: existing[0].createdBy || userUuid,
        })
        .where(eq(dbLessons.id, lessonUuid));
    } else {
      await db.insert(dbLessons).values({
        id: lessonUuid,
        topicId: topicUuid!,
        title: data.title,
        description: data.description,
        richContent: data.richContent,
        videoUrl: formattedVideo || null,
        duration: data.duration,
        status: data.status,
        lessonQuizId: null,
        createdBy: userUuid,
      });
    }

    // 3. Sync Quiz (now foreign key to lessonId is guaranteed to exist)
    if (data.quiz) {
      if (!lessonQuizId) {
        // Create new quiz linked to the lesson
        const [newQuiz] = await db
          .insert(quizzes)
          .values({
            lessonId: lessonUuid,
            topicId: topicUuid || null,
            createdBy: userUuid,
            title: data.quiz.title || `Quick Check: ${data.title}`,
            passingScore: data.quiz.passingScore ?? 70,
            timeLimitMinutes: data.quiz.timeLimitMinutes ?? 0,
            showFeedback: data.quiz.showFeedback ?? true,
          })
          .returning();
        lessonQuizId = newQuiz.id;
      } else {
        // Update existing quiz
        await db
          .update(quizzes)
          .set({
            lessonId: lessonUuid,
            topicId: topicUuid || null,
            title: data.quiz.title || `Quick Check: ${data.title}`,
            passingScore: data.quiz.passingScore ?? 70,
            timeLimitMinutes: data.quiz.timeLimitMinutes ?? 0,
            showFeedback: data.quiz.showFeedback ?? true,
          })
          .where(eq(quizzes.id, lessonQuizId));
      }

      // Sync Quiz Questions: Delete old questions and answers
      const oldQuestions = await db.select().from(questions).where(eq(questions.quizId, lessonQuizId));
      if (oldQuestions.length > 0) {
        const oldQuestionUuids = oldQuestions.map((q) => q.id);
        await db.delete(answers).where(inArray(answers.questionId, oldQuestionUuids));
        await db.delete(questions).where(eq(questions.quizId, lessonQuizId));
      }

      // Insert new questions and their answers
      if (data.quiz.questions && data.quiz.questions.length > 0) {
        for (let i = 0; i < data.quiz.questions.length; i++) {
          const q = data.quiz.questions[i];
          const [insertedQuestion] = await db
            .insert(questions)
            .values({
              quizId: lessonQuizId,
              type: q.type,
              question: q.question || `Question ${i + 1}`,
              explanation: q.explanation || "",
              orderNumber: q.orderNumber || i + 1,
            })
            .returning();

          if (q.answers && q.answers.length > 0) {
            await db.insert(answers).values(
              q.answers.map((a) => ({
                questionId: insertedQuestion.id,
                answer: a.answer,
                isCorrect: a.isCorrect,
              }))
            );
          }
        }
      }

      // Link quiz to the lesson row
      await db
        .update(dbLessons)
        .set({ lessonQuizId: lessonQuizId })
        .where(eq(dbLessons.id, lessonUuid));
    } else {
      // If quiz was explicitly disabled/removed, disassociate it
      await db
        .update(dbLessons)
        .set({ lessonQuizId: null })
        .where(eq(dbLessons.id, lessonUuid));
      lessonQuizId = null;
    }

    // 4. Sync Attachments: Delete old attachments and insert new ones
    // Note: Column in lessonAttachments is 'fileType', not 'type'
    await db.delete(lessonAttachments).where(eq(lessonAttachments.lessonId, lessonUuid));
    if (data.attachments && data.attachments.length > 0) {
      await db.insert(lessonAttachments).values(
        data.attachments.map((att, idx) => ({
          lessonId: lessonUuid,
          name: att.name,
          url: att.url,
          fileType: (att.type as any) || "other",
          orderNumber: att.orderNumber || idx + 1,
        }))
      );
    }

    // 5. Revalidate all cached views
    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath(`/teacher/lessons/${lessonId}`);
    revalidatePath(`/teacher/lessons/${lessonUuid}`);
    revalidatePath(`/admin/lessons/${lessonId}`);
    revalidatePath(`/admin/lessons/${lessonUuid}`);
    revalidatePath(`/dashboard/lessons/${lessonId}`);
    revalidatePath(`/dashboard/lessons/${lessonUuid}`);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/quizzes");
    revalidatePath("/dashboard/progress");

    return { success: true, lessonId: lessonUuid };
  } catch (err: any) {
    console.error("Failed to upsert lesson:", err);
    return { success: false, error: err.message || "Failed to save lesson content." };
  }
}

