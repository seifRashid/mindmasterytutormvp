"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  aiGradingResults as dbAiResults,
  quizAttemptAnswers as dbAttemptAnswers,
  quizAttempts as dbAttempts,
  questions as dbQuestions,
  quizzes as dbQuizzes,
  users as dbUsers,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import { evaluateStudentAnswer } from "@/lib/ai/grading";

/**
 * Fetch AI-graded submissions for teacher review.
 */
export async function getAiGradedSubmissionsAction(filters?: {
  quizId?: string;
  requiresReviewOnly?: boolean;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin role required." };
  }

  try {
    const query = db
      .select({
        id: dbAiResults.id,
        quizAttemptAnswerId: dbAiResults.quizAttemptAnswerId,
        questionId: dbAiResults.questionId,
        studentId: dbAiResults.studentId,
        studentName: dbUsers.name,
        studentEmail: dbUsers.email,
        score: dbAiResults.score,
        maxScore: dbAiResults.maxScore,
        status: dbAiResults.status,
        confidence: dbAiResults.confidence,
        criteriaResults: dbAiResults.criteriaResults,
        missingConcepts: dbAiResults.missingConcepts,
        detectedMisconceptions: dbAiResults.detectedMisconceptions,
        feedback: dbAiResults.feedback,
        model: dbAiResults.model,
        promptVersion: dbAiResults.promptVersion,
        requiresTeacherReview: dbAiResults.requiresTeacherReview,
        teacherScore: dbAiResults.teacherScore,
        teacherFeedback: dbAiResults.teacherFeedback,
        teacherReviewedAt: dbAiResults.teacherReviewedAt,
        createdAt: dbAiResults.createdAt,
        // Answer & Question details
        textAnswer: dbAttemptAnswers.textAnswer,
        gradingStatus: dbAttemptAnswers.gradingStatus,
        attemptId: dbAttemptAnswers.attemptId,
        questionText: dbQuestions.question,
        expectedAnswer: dbQuestions.expectedAnswer,
        gradingRubric: dbQuestions.gradingRubric,
        quizId: dbQuestions.quizId,
      })
      .from(dbAiResults)
      .innerJoin(dbAttemptAnswers, eq(dbAiResults.quizAttemptAnswerId, dbAttemptAnswers.id))
      .innerJoin(dbQuestions, eq(dbAiResults.questionId, dbQuestions.id))
      .innerJoin(dbUsers, eq(dbAiResults.studentId, dbUsers.id))
      .orderBy(desc(dbAiResults.createdAt));

    const results = await query;

    // In-memory filtering if optional parameters specified
    let filtered = results;
    if (filters?.quizId) {
      filtered = filtered.filter((r) => r.quizId === filters.quizId);
    }
    if (filters?.requiresReviewOnly) {
      filtered = filtered.filter((r) => r.requiresTeacherReview);
    }

    return { success: true, submissions: filtered };
  } catch (err: any) {
    console.error("Failed to fetch AI grading submissions:", err);
    return { error: "Failed to load submissions." };
  }
}

/**
 * Teacher overrides AI grade with audit trail preservation.
 */
export async function overrideAiGradeAction(params: {
  resultId: string;
  teacherScore: number;
  teacherFeedback?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin permissions required." };
  }

  const resultUuid = toUuid(params.resultId);
  const teacherUuid = toUuid(session.id);

  try {
    // 1. Fetch existing AI grading record
    const [existing] = await db
      .select()
      .from(dbAiResults)
      .where(eq(dbAiResults.id, resultUuid));

    if (!existing) {
      return { error: "Grading record not found." };
    }

    const validatedScore = Math.max(0, Math.min(existing.maxScore, params.teacherScore));

    // 2. Update AI grading result with teacher override (preserving original AI score for audit)
    await db
      .update(dbAiResults)
      .set({
        teacherScore: validatedScore,
        teacherFeedback: params.teacherFeedback?.trim() || null,
        teacherReviewedAt: new Date(),
        teacherReviewedBy: teacherUuid,
        requiresTeacherReview: false,
        updatedAt: new Date(),
      })
      .where(eq(dbAiResults.id, resultUuid));

    // 3. Update the associated quiz_attempt_answers record
    await db
      .update(dbAttemptAnswers)
      .set({
        score: validatedScore,
        isCorrect: validatedScore === existing.maxScore,
        gradingStatus: "completed",
      })
      .where(eq(dbAttemptAnswers.id, existing.quizAttemptAnswerId));

    // 4. Recalculate student's overall quiz_attempts score
    const [attemptAnswer] = await db
      .select()
      .from(dbAttemptAnswers)
      .where(eq(dbAttemptAnswers.id, existing.quizAttemptAnswerId));

    if (attemptAnswer?.attemptId) {
      const allAttemptAnswers = await db
        .select()
        .from(dbAttemptAnswers)
        .where(eq(dbAttemptAnswers.attemptId, attemptAnswer.attemptId));

      const [attempt] = await db
        .select()
        .from(dbAttempts)
        .where(eq(dbAttempts.id, attemptAnswer.attemptId));

      if (attempt) {
        const totalEarned = allAttemptAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
        const maxMarks = attempt.maxTotalMarks || allAttemptAnswers.reduce((sum, a) => sum + (a.maxScore || 1), 0);
        const newScorePct = maxMarks > 0 ? Math.round((totalEarned / maxMarks) * 100) : 0;

        await db
          .update(dbAttempts)
          .set({
            score: newScorePct,
            totalMarks: totalEarned,
          })
          .where(eq(dbAttempts.id, attempt.id));
      }
    }

    revalidatePath("/teacher/grading");
    revalidatePath("/admin/grading");
    revalidatePath("/dashboard/progress");

    return { success: true, updatedScore: validatedScore };
  } catch (err: any) {
    console.error("Failed to override grade:", err);
    return { error: err?.message || "Failed to update grade." };
  }
}

/**
 * Retries AI grading for an answer that was pending or failed.
 */
export async function retryPendingGradingAction(answerId: string) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin permissions required." };
  }

  const answerUuid = toUuid(answerId);

  try {
    const [answerRecord] = await db
      .select()
      .from(dbAttemptAnswers)
      .where(eq(dbAttemptAnswers.id, answerUuid));

    if (!answerRecord) return { error: "Answer record not found." };

    const [questionRecord] = await db
      .select()
      .from(dbQuestions)
      .where(eq(dbQuestions.id, answerRecord.questionId));

    if (!questionRecord) return { error: "Question not found." };

    const [attemptRecord] = await db
      .select()
      .from(dbAttempts)
      .where(eq(dbAttempts.id, answerRecord.attemptId));

    const studentUuid = attemptRecord?.userId || toUuid(session.id);

    // Call grading service
    const aiEval = await evaluateStudentAnswer({
      question: questionRecord.question,
      expectedAnswer: questionRecord.expectedAnswer || "",
      keyConcepts: questionRecord.keyConcepts || [],
      acceptableAnswers: questionRecord.acceptableAnswers || [],
      misconceptions: questionRecord.commonMisconceptions || [],
      rubric: questionRecord.gradingRubric || [{ criterion: "Accuracy", marks: questionRecord.maxMarks }],
      maxMarks: questionRecord.maxMarks,
      studentAnswer: answerRecord.textAnswer || "",
    });

    const awarded = Math.min(questionRecord.maxMarks, Math.max(0, aiEval.score));

    // Update attempt answer
    await db
      .update(dbAttemptAnswers)
      .set({
        score: awarded,
        isCorrect: awarded === questionRecord.maxMarks,
        gradingStatus: aiEval.requiresTeacherReview ? "requires_review" : "completed",
      })
      .where(eq(dbAttemptAnswers.id, answerUuid));

    // Upsert or insert AI grading result
    const existingAi = await db
      .select()
      .from(dbAiResults)
      .where(eq(dbAiResults.quizAttemptAnswerId, answerUuid));

    if (existingAi.length > 0) {
      await db
        .update(dbAiResults)
        .set({
          score: awarded,
          status: aiEval.status,
          confidence: aiEval.confidence,
          criteriaResults: aiEval.criteriaResults,
          missingConcepts: aiEval.missingConcepts,
          detectedMisconceptions: aiEval.detectedMisconceptions,
          feedback: aiEval.feedback,
          requiresTeacherReview: aiEval.requiresTeacherReview,
          updatedAt: new Date(),
        })
        .where(eq(dbAiResults.id, existingAi[0].id));
    } else {
      await db.insert(dbAiResults).values({
        id: crypto.randomUUID(),
        quizAttemptAnswerId: answerUuid,
        questionId: questionRecord.id,
        studentId: studentUuid,
        score: awarded,
        maxScore: questionRecord.maxMarks,
        status: aiEval.status,
        confidence: aiEval.confidence,
        criteriaResults: aiEval.criteriaResults,
        missingConcepts: aiEval.missingConcepts,
        detectedMisconceptions: aiEval.detectedMisconceptions,
        feedback: aiEval.feedback,
        model: aiEval.model,
        promptVersion: aiEval.promptVersion,
        requiresTeacherReview: aiEval.requiresTeacherReview,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    revalidatePath("/teacher/grading");
    return { success: true, score: awarded };
  } catch (err: any) {
    console.error("Failed to retry grading:", err);
    return { error: err?.message || "Retry failed." };
  }
}

/**
 * Question analytics for teachers
 */
export async function getQuizAiAnalyticsAction(quizId: string) {
  const quizUuid = toUuid(quizId);

  try {
    const questionsList = await db
      .select()
      .from(dbQuestions)
      .where(and(eq(dbQuestions.quizId, quizUuid), eq(dbQuestions.aiGradingEnabled, true)));

    if (questionsList.length === 0) {
      return { success: true, analytics: [] };
    }

    const questionIds = questionsList.map((q) => q.id);
    const allResults = await db
      .select()
      .from(dbAiResults);

    const relevant = allResults.filter((r) => questionIds.includes(r.questionId));

    const analytics = questionsList.map((q) => {
      const qResults = relevant.filter((r) => r.questionId === q.id);
      const count = qResults.length;
      const totalScore = qResults.reduce((sum, r) => sum + (r.teacherScore ?? r.score), 0);
      const avgScore = count > 0 ? (totalScore / count).toFixed(1) : "0.0";
      const correctCount = qResults.filter((r) => r.status === "correct").length;
      const mostlyCount = qResults.filter((r) => r.status === "mostly_correct").length;
      const partialCount = qResults.filter((r) => r.status === "partially_correct").length;
      const incorrectCount = qResults.filter((r) => r.status === "incorrect").length;
      const reviewCount = qResults.filter((r) => r.requiresTeacherReview).length;

      return {
        questionId: q.id,
        questionText: q.question,
        maxMarks: q.maxMarks,
        totalAttempts: count,
        averageScore: avgScore,
        correctPct: count > 0 ? Math.round((correctCount / count) * 100) : 0,
        mostlyPct: count > 0 ? Math.round((mostlyCount / count) * 100) : 0,
        partialPct: count > 0 ? Math.round((partialCount / count) * 100) : 0,
        incorrectPct: count > 0 ? Math.round((incorrectCount / count) * 100) : 0,
        requiresReviewCount: reviewCount,
      };
    });

    return { success: true, analytics };
  } catch (err: any) {
    console.error("Failed to calculate quiz AI analytics:", err);
    return { error: "Failed to calculate analytics." };
  }
}
