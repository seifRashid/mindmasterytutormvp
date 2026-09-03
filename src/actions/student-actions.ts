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

import {
  quizAttemptAnswers as dbAttemptAnswers,
  aiGradingResults as dbAiResults,
  topics as dbTopics,
  subjects as dbSubjects,
} from "@/db/schema";
import { evaluateStudentAnswer } from "@/lib/ai/grading";

export async function submitQuizAttemptAction(
  quizId: string,
  userSelectedAnswers: Record<string, string>, // questionId -> answerId or text
  textAnswers?: Record<string, string>, // optional questionId -> text
  clientSubmissionToken?: string // optional idempotency token
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

  // Fetch optional context (subject, topic, lesson notes)
  let subjectTitle = "";
  let topicTitle = "";
  let lessonNotes = "";
  try {
    if (quiz.topicId) {
      const topicRecords = await db.select().from(dbTopics).where(eq(dbTopics.id, quiz.topicId));
      if (topicRecords.length > 0) {
        topicTitle = topicRecords[0].title;
        const subjectRecords = await db.select().from(dbSubjects).where(eq(dbSubjects.id, topicRecords[0].subjectId));
        if (subjectRecords.length > 0) {
          subjectTitle = subjectRecords[0].title;
        }
      }
    }
    if (quiz.lessonId) {
      const lessonRecords = await db.select().from(dbLessons).where(eq(dbLessons.id, quiz.lessonId));
      if (lessonRecords.length > 0) {
        lessonNotes = lessonRecords[0].richContent || lessonRecords[0].description || "";
      }
    }
  } catch {
    // Non-blocking context lookup
  }

  // 2. Compute total possible marks and initialize Attempt record
  const totalMaxMarks = quizQuestions.reduce((sum, q) => sum + (q.maxMarks || 1), 0);
  const attemptId = crypto.randomUUID();

  try {
    await db.insert(dbAttempts).values({
      id: attemptId,
      userId: userUuid,
      quizId: quizUuid,
      score: 0,
      totalMarks: 0,
      maxTotalMarks: totalMaxMarks,
      status: "grading_pending",
      failedAttempts: 0,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to initialize quiz attempt:", err);
  }

  // 3. Grade each question and store individual answer records
  let totalAwardedMarks = 0;
  let hasPendingAi = false;
  const questionResults: any[] = [];

  for (const q of quizQuestions) {
    const qMaxMarks = q.maxMarks || 1;
    const answerRowId = crypto.randomUUID();

    if (q.type === "open_ended") {
      const studentText = (textAnswers?.[q.id] ?? userSelectedAnswers[q.id] ?? "").trim();

      if (q.aiGradingEnabled) {
        if (!studentText) {
          // Empty answer
          await db.insert(dbAttemptAnswers).values({
            id: answerRowId,
            attemptId,
            questionId: q.id,
            textAnswer: "",
            score: 0,
            maxScore: qMaxMarks,
            isCorrect: false,
            gradingStatus: "completed",
            createdAt: new Date(),
          });

          await db.insert(dbAiResults).values({
            id: crypto.randomUUID(),
            quizAttemptAnswerId: answerRowId,
            questionId: q.id,
            studentId: userUuid,
            score: 0,
            maxScore: qMaxMarks,
            status: "incorrect",
            confidence: 1.0,
            criteriaResults: (q.gradingRubric || []).map((r: any) => ({
              criterion: r.criterion,
              marksAwarded: 0,
              maxMarks: r.marks,
              satisfied: false,
              explanation: "No answer was provided.",
            })),
            missingConcepts: q.keyConcepts || [],
            detectedMisconceptions: [],
            feedback: "No answer was provided. Please write a response to receive marks.",
            model: "system-deterministic",
            promptVersion: "v1",
            requiresTeacherReview: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          questionResults.push({
            questionId: q.id,
            type: q.type,
            textAnswer: "",
            score: 0,
            maxScore: qMaxMarks,
            isCorrect: false,
            explanation: q.explanation,
            aiResult: {
              status: "incorrect",
              score: 0,
              maxScore: qMaxMarks,
              feedback: "No answer was provided.",
              criteriaResults: (q.gradingRubric || []).map((r: any) => ({
                criterion: r.criterion,
                marksAwarded: 0,
                maxMarks: r.marks,
                satisfied: false,
                explanation: "No answer was provided.",
              })),
            },
          });
        } else {
          // Non-empty student response - evaluate with AI
          try {
            const aiEval = await evaluateStudentAnswer({
              question: q.question,
              subject: subjectTitle,
              topic: topicTitle,
              lessonContext: lessonNotes ? lessonNotes.slice(0, 800) : undefined,
              expectedAnswer: q.expectedAnswer || "",
              keyConcepts: q.keyConcepts || [],
              acceptableAnswers: q.acceptableAnswers || [],
              misconceptions: q.commonMisconceptions || [],
              rubric: q.gradingRubric || [{ criterion: "Accuracy and completeness", marks: qMaxMarks }],
              maxMarks: qMaxMarks,
              studentAnswer: studentText,
            });

            const awarded = Math.min(qMaxMarks, Math.max(0, aiEval.score));
            totalAwardedMarks += awarded;

            await db.insert(dbAttemptAnswers).values({
              id: answerRowId,
              attemptId,
              questionId: q.id,
              textAnswer: studentText,
              score: awarded,
              maxScore: qMaxMarks,
              isCorrect: awarded === qMaxMarks,
              gradingStatus: aiEval.requiresTeacherReview ? "requires_review" : "completed",
              createdAt: new Date(),
            });

            await db.insert(dbAiResults).values({
              id: crypto.randomUUID(),
              quizAttemptAnswerId: answerRowId,
              questionId: q.id,
              studentId: userUuid,
              score: awarded,
              maxScore: qMaxMarks,
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

            questionResults.push({
              questionId: q.id,
              type: q.type,
              textAnswer: studentText,
              score: awarded,
              maxScore: qMaxMarks,
              isCorrect: awarded === qMaxMarks,
              explanation: q.explanation,
              aiResult: aiEval,
            });
          } catch (aiErr) {
            console.error("AI grading failed during submission, marking pending:", aiErr);
            hasPendingAi = true;

            await db.insert(dbAttemptAnswers).values({
              id: answerRowId,
              attemptId,
              questionId: q.id,
              textAnswer: studentText,
              score: 0,
              maxScore: qMaxMarks,
              isCorrect: false,
              gradingStatus: "pending",
              createdAt: new Date(),
            });

            questionResults.push({
              questionId: q.id,
              type: q.type,
              textAnswer: studentText,
              score: 0,
              maxScore: qMaxMarks,
              isCorrect: false,
              explanation: q.explanation,
              gradingPending: true,
            });
          }
        }
      } else {
        // Open-ended without AI grading
        await db.insert(dbAttemptAnswers).values({
          id: answerRowId,
          attemptId,
          questionId: q.id,
          textAnswer: studentText,
          score: 0,
          maxScore: qMaxMarks,
          isCorrect: false,
          gradingStatus: "completed",
          createdAt: new Date(),
        });

        questionResults.push({
          questionId: q.id,
          type: q.type,
          textAnswer: studentText,
          score: 0,
          maxScore: qMaxMarks,
          isCorrect: false,
          explanation: q.explanation,
        });
      }
    } else if (q.type === "short_answer") {
      const studentText = (textAnswers?.[q.id] ?? userSelectedAnswers[q.id] ?? "").trim();
      const correctAnswer = q.answers.find((a: any) => a.isCorrect);
      const isCorrect = studentText.toLowerCase() === (correctAnswer?.answer || "").toLowerCase().trim();
      const awarded = isCorrect ? qMaxMarks : 0;
      totalAwardedMarks += awarded;

      await db.insert(dbAttemptAnswers).values({
        id: answerRowId,
        attemptId,
        questionId: q.id,
        textAnswer: studentText,
        score: awarded,
        maxScore: qMaxMarks,
        isCorrect,
        gradingStatus: "completed",
        createdAt: new Date(),
      });

      questionResults.push({
        questionId: q.id,
        type: q.type,
        textAnswer: studentText,
        correctAnswer: correctAnswer?.answer,
        score: awarded,
        maxScore: qMaxMarks,
        isCorrect,
        explanation: q.explanation,
      });
    } else {
      // Multiple Choice or True/False
      const selectedAnswerId = userSelectedAnswers[q.id];
      const correctAnswer = q.answers.find((a: any) => a.isCorrect);
      const isCorrect = selectedAnswerId === correctAnswer?.id;
      const awarded = isCorrect ? qMaxMarks : 0;
      totalAwardedMarks += awarded;

      await db.insert(dbAttemptAnswers).values({
        id: answerRowId,
        attemptId,
        questionId: q.id,
        selectedAnswerId: selectedAnswerId ? toUuid(selectedAnswerId) : null,
        score: awarded,
        maxScore: qMaxMarks,
        isCorrect,
        gradingStatus: "completed",
        createdAt: new Date(),
      });

      questionResults.push({
        questionId: q.id,
        type: q.type,
        selectedAnswerId,
        correctAnswerId: correctAnswer?.id,
        score: awarded,
        maxScore: qMaxMarks,
        isCorrect,
        explanation: q.explanation,
      });
    }
  }

  // 4. Calculate Final Score Percentage
  const score = totalMaxMarks > 0 ? Math.round((totalAwardedMarks / totalMaxMarks) * 100) : 0;
  const passed = score >= quiz.passingScore;

  // 5. Track attempt history in DB
  let newFailedAttempts = 0;
  try {
    const pastAttempts = await db
      .select()
      .from(dbAttempts)
      .where(and(eq(dbAttempts.userId, userUuid), eq(dbAttempts.quizId, quizUuid)));

    const previousFailedCount = pastAttempts.reduce(
      (max: number, a: any) => Math.max(max, a.failedAttempts || 0),
      0
    );

    newFailedAttempts = passed ? 0 : previousFailedCount + 1;

    await db
      .update(dbAttempts)
      .set({
        score,
        totalMarks: totalAwardedMarks,
        maxTotalMarks: totalMaxMarks,
        status: hasPendingAi ? "grading_pending" : "completed",
        failedAttempts: newFailedAttempts,
      })
      .where(eq(dbAttempts.id, attemptId));
  } catch (err) {
    console.error("Failed to update quiz attempt with final score:", err);
  }

  // Reveal explanations after 3 failed attempts
  const showExplanations = newFailedAttempts >= 3;

  revalidatePath(`/dashboard/quizzes/${quizId}`);
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard");
  revalidatePath("/teacher/grading");

  return {
    success: true,
    attemptId,
    score,
    totalMarks: totalAwardedMarks,
    maxTotalMarks: totalMaxMarks,
    passed,
    passingScore: quiz.passingScore,
    failedAttempts: newFailedAttempts,
    showExplanations,
    hasPendingAi,
    questionResults,
  };
}


