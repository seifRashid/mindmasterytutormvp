"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lessons as dbLessons, lessonAttachments, quizzes, questions, answers } from "@/db/schema";
import { eq, and, lt, isNotNull, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

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
 */
export async function softDeleteLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db
      .update(dbLessons)
      .set({ deletedAt: new Date() })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to soft delete lesson:", err);
    return { success: false, error: "Failed to delete lesson." };
  }
}

/**
 * Restores a soft-deleted lesson by nullifying its deletedAt timestamp.
 */
export async function restoreLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db
      .update(dbLessons)
      .set({ deletedAt: null })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to restore lesson:", err);
    return { success: false, error: "Failed to restore lesson." };
  }
}

/**
 * Permanently deletes a lesson from the database.
 */
export async function permanentlyDeleteLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db.delete(dbLessons).where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to permanently delete lesson:", err);
    return { success: false, error: "Failed to permanently delete lesson." };
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
    const lessonUuid = toUuid(lessonId);
    const topicUuid = toUuid(data.topicId);
    const formattedVideo = formatVideoEmbedUrl(data.videoUrl);

    // 1. Check if lesson exists
    const existing = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));

    // Determine the lessonQuizId
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

    // 2. Sync Quiz if enabled
    if (data.quiz) {
      if (!lessonQuizId) {
        // Create new quiz
        const [newQuiz] = await db
          .insert(quizzes)
          .values({
            lessonId: lessonUuid,
            topicId: topicUuid,
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
            topicId: topicUuid,
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
    } else {
      // If quiz was explicitly disabled/removed, disassociate it
      lessonQuizId = null;
    }

    // 3. Upsert Lesson details
    if (existing.length > 0) {
      await db
        .update(dbLessons)
        .set({
          topicId: topicUuid,
          title: data.title,
          description: data.description,
          richContent: data.richContent,
          videoUrl: formattedVideo || null,
          duration: data.duration,
          status: data.status,
          lessonQuizId: lessonQuizId,
        })
        .where(eq(dbLessons.id, lessonUuid));
    } else {
      await db.insert(dbLessons).values({
        id: lessonUuid,
        topicId: topicUuid,
        title: data.title,
        description: data.description,
        richContent: data.richContent,
        videoUrl: formattedVideo || null,
        duration: data.duration,
        status: data.status,
        lessonQuizId: lessonQuizId,
      });
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

    return { success: true, lessonId: lessonUuid };
  } catch (err: any) {
    console.error("Failed to upsert lesson:", err);
    return { success: false, error: err.message || "Failed to save lesson content." };
  }
}

