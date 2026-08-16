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
        type: "multiple_choice" | "true_false" | "short_answer";
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

    await db.transaction(async (tx) => {
      // 1. Check if lesson exists
      const existing = await tx.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));

      // Determine the lessonQuizId
      let lessonQuizId: string | null = null;
      if (existing.length > 0) {
        lessonQuizId = existing[0].lessonQuizId;
      }

      // 2. Sync Quiz if enabled
      if (data.quiz) {
        if (!lessonQuizId) {
          // Create new quiz
          const [newQuiz] = await tx
            .insert(quizzes)
            .values({
              title: data.quiz.title,
              passingScore: data.quiz.passingScore,
              timeLimitMinutes: data.quiz.timeLimitMinutes,
              showFeedback: data.quiz.showFeedback,
            })
            .returning();
          lessonQuizId = newQuiz.id;
        } else {
          // Update existing quiz
          await tx
            .update(quizzes)
            .set({
              title: data.quiz.title,
              passingScore: data.quiz.passingScore,
              timeLimitMinutes: data.quiz.timeLimitMinutes,
              showFeedback: data.quiz.showFeedback,
            })
            .where(eq(quizzes.id, lessonQuizId));
        }

        // Sync Quiz Questions: Delete old questions and answers
        const oldQuestions = await tx.select().from(questions).where(eq(questions.quizId, lessonQuizId));
        if (oldQuestions.length > 0) {
          const oldQuestionUuids = oldQuestions.map((q) => q.id);
          await tx.delete(answers).where(inArray(answers.questionId, oldQuestionUuids));
          await tx.delete(questions).where(eq(questions.quizId, lessonQuizId));
        }

        // Insert new questions and their answers
        for (const q of data.quiz.questions) {
          const [insertedQuestion] = await tx
            .insert(questions)
            .values({
              quizId: lessonQuizId,
              type: q.type,
              question: q.question,
              explanation: q.explanation || "",
              orderNumber: q.orderNumber,
            })
            .returning();

          if (q.answers && q.answers.length > 0) {
            await tx.insert(answers).values(
              q.answers.map((a) => ({
                questionId: insertedQuestion.id,
                answer: a.answer,
                isCorrect: a.isCorrect,
              }))
            );
          }
        }
      } else {
        // If quiz was disabled/removed, disassociate it
        lessonQuizId = null;
      }

      // 3. Upsert Lesson details
      if (existing.length > 0) {
        await tx
          .update(dbLessons)
          .set({
            topicId: topicUuid,
            title: data.title,
            description: data.description,
            richContent: data.richContent,
            videoUrl: data.videoUrl || null,
            duration: data.duration,
            status: data.status,
            lessonQuizId: lessonQuizId,
          })
          .where(eq(dbLessons.id, lessonUuid));
      } else {
        await tx.insert(dbLessons).values({
          id: lessonUuid,
          topicId: topicUuid,
          title: data.title,
          description: data.description,
          richContent: data.richContent,
          videoUrl: data.videoUrl || null,
          duration: data.duration,
          status: data.status,
          lessonQuizId: lessonQuizId,
        });
      }

      // 4. Sync Attachments: Delete old attachments and insert new ones
      await tx.delete(lessonAttachments).where(eq(lessonAttachments.lessonId, lessonUuid));
      if (data.attachments && data.attachments.length > 0) {
        await tx.insert(lessonAttachments).values(
          data.attachments.map((att) => ({
            lessonId: lessonUuid,
            name: att.name,
            url: att.url,
            type: att.type,
            orderNumber: att.orderNumber,
          }))
        );
      }
    });

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to upsert lesson:", err);
    return { success: false, error: "Failed to save lesson content." };
  }
}
