"use server";

import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import {
  ClassLevel,
  INITIAL_CLASSES,
  INITIAL_LESSONS,
  INITIAL_QUESTIONS,
  INITIAL_QUIZZES,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
  Lesson,
  Question,
  Quiz,
  Subject,
  Topic,
} from "@/lib/mock-data";
import { db } from "@/db";
import {
  subjects,
  classes as dbClasses,
  topics as dbTopics,
  lessons as dbLessons,
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
} from "@/db/schema";
import { toUuid } from "@/lib/id-mapper";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { generateMarkingGuide, evaluateStudentAnswer } from "@/lib/ai/grading";
import { getAiConfig } from "@/lib/ai/client";
import { formatVideoEmbedUrl } from "@/lib/video-utils";

export async function createClassAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "Class name is required" };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newClass: ClassLevel = {
    id: `class-${Date.now()}`,
    name,
    slug,
    createdAt: new Date().toISOString(),
  };

  INITIAL_CLASSES.push(newClass);

  try {
    await db.insert(dbClasses).values({
      id: toUuid(newClass.id),
      name: newClass.name,
      slug: newClass.slug,
      createdAt: new Date(newClass.createdAt),
    });
  } catch (err) {
    console.error("Failed to insert class into DB:", err);
    return { error: "Failed to create class level in database." };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/dashboard/subjects");
  revalidatePath("/(auth)/register/student");
  return { success: true, classLevel: newClass };
}

export async function createSubjectAction(formData: FormData) {
  const classId = formData.get("classId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "BookOpen";

  if (!classId || !title) return { error: "Class and title are required" };

  const classUuid = toUuid(classId);
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    // Fetch parent class to scope subject slug by grade and prevent duplicate subject titles in the same grade
    const classRows = await db.select().from(dbClasses).where(eq(dbClasses.id, classUuid));
    const parentClass = classRows[0];
    const classSlug = parentClass?.slug || classId.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const existingSubjectsInClass = await db
      .select()
      .from(subjects)
      .where(eq(subjects.classId, classUuid));

    const duplicate = existingSubjectsInClass.find(
      (s) => s.title.trim().toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      return {
        error: `Subject "${title}" already exists in ${parentClass?.name || "this class"}.`,
      };
    }

    const slug = titleSlug.startsWith(`${classSlug}-`)
      ? titleSlug
      : `${classSlug}-${titleSlug}`;

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      classId: classUuid,
      title,
      slug,
      description: description || "",
      icon,
      createdAt: new Date().toISOString(),
    };

    INITIAL_SUBJECTS.push(newSubject);

    await db.insert(subjects).values({
      id: toUuid(newSubject.id),
      classId: classUuid,
      title: newSubject.title,
      slug: newSubject.slug,
      description: newSubject.description || null,
      icon: newSubject.icon,
      createdAt: new Date(newSubject.createdAt),
    });

    revalidatePath("/admin/subjects");
    revalidatePath("/admin/topics");
    revalidatePath("/dashboard/subjects", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/progress");
    return { success: true, subject: newSubject };
  } catch (err) {
    console.error("Failed to insert subject in DB:", err);
    return { error: "Failed to create subject in database." };
  }
}

export async function createTopicAction(formData: FormData) {
  const subjectId = formData.get("subjectId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = formData.get("description") as string;

  if (!subjectId || !title) return { error: "Subject and title are required" };

  const subjectUuid = toUuid(subjectId);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const existingTopics = await db
      .select()
      .from(dbTopics)
      .where(eq(dbTopics.subjectId, subjectUuid));

    const nextOrder =
      existingTopics.length > 0
        ? Math.max(...existingTopics.map((t) => t.orderNumber || 0)) + 1
        : 1;

    const newTopic: Topic = {
      id: `top-${Date.now()}`,
      subjectId: subjectUuid,
      title,
      slug,
      description: description || "",
      orderNumber: nextOrder,
      createdAt: new Date().toISOString(),
    };

    INITIAL_TOPICS.push(newTopic);

    await db.insert(dbTopics).values({
      id: toUuid(newTopic.id),
      subjectId: subjectUuid,
      title: newTopic.title,
      slug: newTopic.slug,
      description: newTopic.description || null,
      orderNumber: newTopic.orderNumber,
      createdAt: new Date(newTopic.createdAt),
    });

    revalidatePath("/admin/topics");
    revalidatePath("/admin/lessons");
    revalidatePath("/teacher/lessons");
    revalidatePath("/dashboard/subjects", "layout");
    revalidatePath("/dashboard");
    return { success: true, topic: newTopic };
  } catch (err) {
    console.error("Failed to insert topic into DB:", err);
    return { error: "Failed to create topic in database." };
  }
}

export async function createLessonAction(formData: FormData) {
  const topicId = formData.get("topicId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = formData.get("description") as string;
  const videoUrl = formData.get("videoUrl") as string;
  const duration = parseInt((formData.get("duration") as string) || "600", 10);

  if (!topicId || !title) return { error: "Topic and title are required" };

  const session = await getSession();
  const userUuid = session?.id ? toUuid(session.id) : null;
  const formattedVideo = videoUrl ? formatVideoEmbedUrl(videoUrl) : null;
  const topicUuid = toUuid(topicId);

  try {
    const existingLessons = await db
      .select()
      .from(dbLessons)
      .where(eq(dbLessons.topicId, topicUuid));

    const nextOrder =
      existingLessons.length > 0
        ? Math.max(...existingLessons.map((l) => l.orderNumber || 0)) + 1
        : 1;

    const lessonUuid = crypto.randomUUID();
    const newLesson: Lesson = {
      id: lessonUuid,
      topicId: topicUuid,
      title,
      description: description || "",
      videoUrl: formattedVideo || videoUrl || "",
      duration,
      orderNumber: nextOrder,
      createdAt: new Date().toISOString(),
    };

    INITIAL_LESSONS.push(newLesson);

    await db.insert(dbLessons).values({
      id: lessonUuid,
      topicId: topicUuid,
      title,
      description: description || null,
      richContent: null,
      videoUrl: formattedVideo || null,
      duration,
      orderNumber: nextOrder,
      status: "published",
      createdBy: userUuid,
      createdAt: new Date(),
    });

    revalidatePath("/admin/lessons");
    revalidatePath("/teacher/lessons");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subjects", "layout");
    revalidatePath("/dashboard/progress");
    return { success: true, lesson: newLesson };
  } catch (err) {
    console.error("Failed to insert lesson into DB:", err);
    return { error: "Failed to create lesson in database." };
  }
}

export async function createQuizAction(formData: FormData) {
  const topicId = formData.get("topicId") as string;
  const title = formData.get("title") as string;
  const passingScore = parseInt((formData.get("passingScore") as string) || "70", 10);
  const questionText = formData.get("questionText") as string;
  const explanation = formData.get("explanation") as string;
  const optA = formData.get("optA") as string;
  const optB = formData.get("optB") as string;
  const optC = formData.get("optC") as string;
  const optD = formData.get("optD") as string;
  const correctIdx = formData.get("correctAnswer") as string; // '0', '1', '2', '3'

  if (!topicId || !title || !questionText) {
    return { error: "Topic, quiz title, and question text are required" };
  }

  const session = await getSession();
  const userUuid = session?.id ? toUuid(session.id) : null;

  const quizId = `quiz-${Date.now()}`;
  const newQuiz: Quiz = {
    id: quizId,
    topicId,
    title,
    passingScore,
    showFeedback: true,
    createdBy: userUuid,
    createdAt: new Date().toISOString(),
  };

  INITIAL_QUIZZES.push(newQuiz);

  const questionId = `q-${Date.now()}`;
  const options = [optA, optB, optC, optD].filter(Boolean);

  const newQuestion: Question = {
    id: questionId,
    quizId,
    type: "multiple_choice",
    question: questionText,
    explanation: explanation || "Carefully review the lesson video to understand the core concept.",
    orderNumber: 1,
    answers: options.map((opt, idx) => ({
      id: `a-${Date.now()}-${idx}`,
      questionId,
      answer: opt,
      isCorrect: String(idx) === correctIdx,
    })),
  };

  INITIAL_QUESTIONS.push(newQuestion);

  try {
    await db.insert(dbQuizzes).values({
      id: toUuid(newQuiz.id),
      topicId: toUuid(topicId),
      title: newQuiz.title,
      passingScore: newQuiz.passingScore,
      showFeedback: newQuiz.showFeedback,
      createdBy: userUuid,
      createdAt: new Date(newQuiz.createdAt),
    });

    await db.insert(dbQuestions).values({
      id: toUuid(newQuestion.id),
      quizId: toUuid(quizId),
      type: newQuestion.type,
      question: newQuestion.question,
      explanation: newQuestion.explanation,
      orderNumber: newQuestion.orderNumber,
      createdAt: new Date(),
    });

    for (const ans of newQuestion.answers) {
      await db.insert(dbAnswers).values({
        id: toUuid(ans.id),
        questionId: toUuid(newQuestion.id),
        answer: ans.answer,
        isCorrect: ans.isCorrect,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    console.error("Failed to insert quiz/question in DB:", err);
  }

  revalidatePath("/admin/quizzes");
  revalidatePath("/teacher/quizzes");
  revalidatePath("/dashboard/quizzes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subjects");
  return { success: true, quiz: newQuiz };
}

export async function deleteEntityAction(entityType: "class" | "subject" | "topic" | "lesson" | "quiz", id: string) {
  if (entityType === "class") {
    const idx = INITIAL_CLASSES.findIndex((c) => c.id === id);
    if (idx > -1) INITIAL_CLASSES.splice(idx, 1);

    try {
      await db.delete(dbClasses).where(eq(dbClasses.id, toUuid(id)));
    } catch (err) {
      console.error("Failed to delete class from DB:", err);
      return { error: "Failed to delete class level from database." };
    }
  } else if (entityType === "subject") {
    const idx = INITIAL_SUBJECTS.findIndex((s) => s.id === id);
    if (idx > -1) INITIAL_SUBJECTS.splice(idx, 1);

    try {
      await db.delete(subjects).where(eq(subjects.id, toUuid(id)));
    } catch (err) {
      console.error("Failed to delete subject from DB:", err);
      return { error: "Failed to delete subject from database." };
    }
  } else if (entityType === "topic") {
    const idx = INITIAL_TOPICS.findIndex((t) => t.id === id);
    if (idx > -1) INITIAL_TOPICS.splice(idx, 1);

    try {
      await db.delete(dbTopics).where(eq(dbTopics.id, toUuid(id)));
    } catch (err) {
      console.error("Failed to delete topic from DB:", err);
      return { error: "Failed to delete topic from database." };
    }
  } else if (entityType === "lesson") {
    const idx = INITIAL_LESSONS.findIndex((l) => l.id === id);
    if (idx > -1) INITIAL_LESSONS.splice(idx, 1);

    try {
      await db.update(dbLessons).set({ deletedAt: new Date() }).where(eq(dbLessons.id, toUuid(id)));
    } catch (err) {
      console.error("Failed to delete lesson from DB:", err);
      return { error: "Failed to delete lesson from database." };
    }
  } else if (entityType === "quiz") {
    const session = await getSession();
    if (session && session.role !== "admin") {
      const existing = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, toUuid(id)));
      const userUuid = session.id ? toUuid(session.id) : null;
      if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
        return { error: "Unauthorized: Teachers can only delete quizzes created by themselves." };
      }
    }

    const idx = INITIAL_QUIZZES.findIndex((q) => q.id === id);
    if (idx > -1) INITIAL_QUIZZES.splice(idx, 1);

    // Also delete questions and answers in-memory
    const qIdsToDelete = INITIAL_QUESTIONS.filter((q) => q.quizId === id).map((q) => q.id);
    for (const qId of qIdsToDelete) {
      const qIdx = INITIAL_QUESTIONS.findIndex((q) => q.id === qId);
      if (qIdx > -1) INITIAL_QUESTIONS.splice(qIdx, 1);
    }

    try {
      await db.delete(dbQuizzes).where(eq(dbQuizzes.id, toUuid(id)));
    } catch (err) {
      console.error("Failed to delete quiz from DB:", err);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/classes");
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/topics");
  revalidatePath("/admin/lessons");
  revalidatePath("/admin/quizzes");
  revalidatePath("/teacher");
  revalidatePath("/teacher/lessons");
  revalidatePath("/teacher/quizzes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subjects", "layout");
  revalidatePath("/dashboard/quizzes");
  revalidatePath("/dashboard/progress");
  revalidatePath(`/dashboard/lessons/${id}`);
  revalidatePath(`/dashboard/quizzes/${id}`);
  return { success: true };
}

export async function editSubjectAction(formData: FormData) {
  const id = formData.get("id") as string;
  const classId = formData.get("classId") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "BookOpen";

  if (!id || !classId || !title) return { error: "ID, Class, and title are required" };

  const subjectUuid = toUuid(id);
  const classUuid = toUuid(classId);
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const classRows = await db.select().from(dbClasses).where(eq(dbClasses.id, classUuid));
    const parentClass = classRows[0];
    const classSlug = parentClass?.slug || classId.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const existingSubjectsInClass = await db
      .select()
      .from(subjects)
      .where(eq(subjects.classId, classUuid));

    const duplicate = existingSubjectsInClass.find(
      (s) => s.id !== subjectUuid && s.title.trim().toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      return {
        error: `Subject "${title}" already exists in ${parentClass?.name || "this class"}.`,
      };
    }

    const slug = titleSlug.startsWith(`${classSlug}-`)
      ? titleSlug
      : `${classSlug}-${titleSlug}`;

    // Update in-memory
    const idx = INITIAL_SUBJECTS.findIndex((s) => s.id === id);
    if (idx > -1) {
      INITIAL_SUBJECTS[idx] = {
        ...INITIAL_SUBJECTS[idx],
        classId: classUuid,
        title,
        slug,
        description: description || "",
        icon,
      };
    }

    await db
      .update(subjects)
      .set({
        classId: classUuid,
        title,
        slug,
        description: description || null,
        icon,
      })
      .where(eq(subjects.id, subjectUuid));
  } catch (err) {
    console.error("Failed to update subject in DB:", err);
    return { error: "Failed to update subject in database." };
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/admin/topics");
  revalidatePath("/dashboard/subjects", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  return { success: true };
}

export async function editClassAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  if (!id || !name) return { error: "ID and name are required." };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Update in-memory
  const idx = INITIAL_CLASSES.findIndex((c) => c.id === id);
  if (idx > -1) {
    INITIAL_CLASSES[idx] = {
      ...INITIAL_CLASSES[idx],
      name,
      slug,
    };
  }

  // Update DB
  try {
    await db
      .update(dbClasses)
      .set({
        name,
        slug,
      })
      .where(eq(dbClasses.id, toUuid(id)));
  } catch (err) {
    console.error("Failed to update class in DB:", err);
    return { error: "Failed to update class in database." };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/dashboard/subjects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function editTopicAction(formData: FormData) {
  const id = formData.get("id") as string;
  const subjectId = formData.get("subjectId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const orderNumber = parseInt(formData.get("orderNumber") as string || "1", 10);

  if (!id || !subjectId || !title) return { error: "ID, Subject, and title are required." };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Update in-memory
  const idx = INITIAL_TOPICS.findIndex((t) => t.id === id);
  if (idx > -1) {
    INITIAL_TOPICS[idx] = {
      ...INITIAL_TOPICS[idx],
      subjectId,
      title,
      slug,
      description: description || "",
      orderNumber,
    };
  }

  // Update DB
  try {
    await db
      .update(dbTopics)
      .set({
        subjectId: toUuid(subjectId),
        title,
        slug,
        description: description || null,
        orderNumber,
      })
      .where(eq(dbTopics.id, toUuid(id)));
  } catch (err) {
    console.error("Failed to update topic in DB:", err);
    return { error: "Failed to update topic in database." };
  }

  revalidatePath("/admin/topics");
  revalidatePath("/dashboard/subjects");
  revalidatePath("/dashboard");
  return { success: true };
}

export interface SaveQuizPayload {
  id?: string;
  topicId: string;
  lessonId?: string | null;
  title: string;
  passingScore?: number;
  timeLimitMinutes?: number;
  showFeedback?: boolean;
  questions: Array<{
    id?: string;
    type: "multiple_choice" | "true_false" | "short_answer" | "open_ended";
    question: string;
    explanation?: string;
    orderNumber?: number;
    maxMarks?: number;
    aiGradingEnabled?: boolean;
    expectedAnswer?: string;
    keyConcepts?: string[];
    acceptableAnswers?: string[];
    commonMisconceptions?: string[];
    gradingRubric?: Array<{ criterion: string; marks: number }>;
    answers: Array<{
      id?: string;
      answer: string;
      isCorrect: boolean;
    }>;
  }>;
}

export async function saveQuizWithQuestionsAction(payload: SaveQuizPayload) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin permissions required." };
  }

  const title = payload.title?.trim();
  if (!title) return { error: "Quiz title is required." };
  if (!payload.topicId) return { error: "Parent topic selection is required." };

  if (!payload.questions || payload.questions.length === 0) {
    return { error: "At least one question is required for the quiz." };
  }

  // Validate each question
  for (let i = 0; i < payload.questions.length; i++) {
    const q = payload.questions[i];
    if (!q.question?.trim()) {
      return { error: `Question #${i + 1} statement is empty.` };
    }

    if (q.type === "open_ended") {
      const maxMarks = q.maxMarks || 1;
      if (maxMarks < 1) {
        return { error: `Question #${i + 1} maximum marks must be at least 1.` };
      }

      if (q.aiGradingEnabled) {
        if (!q.expectedAnswer?.trim()) {
          return { error: `Question #${i + 1} has AI grading enabled but no Expected Answer provided.` };
        }
        if (!q.gradingRubric || q.gradingRubric.length === 0) {
          return { error: `Question #${i + 1} has AI grading enabled but no Rubric criteria defined.` };
        }
        const totalRubricMarks = q.gradingRubric.reduce((sum, item) => sum + (Number(item.marks) || 0), 0);
        if (totalRubricMarks !== maxMarks) {
          return {
            error: `Question #${i + 1} rubric criteria marks sum to ${totalRubricMarks}, which must equal the question's maximum marks (${maxMarks}).`,
          };
        }
      }
    } else {
      if (!q.answers || q.answers.length === 0) {
        return { error: `Question #${i + 1} must have answer choices.` };
      }
      let hasCorrect = false;
      for (const ans of q.answers) {
        if (!ans.answer?.trim()) {
          return { error: `Answer option for Question #${i + 1} cannot be empty.` };
        }
        if (ans.isCorrect) hasCorrect = true;
      }
      if (!hasCorrect) {
        return { error: `Please mark at least one correct option for Question #${i + 1}.` };
      }
    }
  }

  const isNew = !payload.id;
  const quizId = payload.id ? toUuid(payload.id) : crypto.randomUUID();
  const passingScore = Math.min(100, Math.max(10, payload.passingScore ?? 70));
  const timeLimitMinutes = Math.max(0, payload.timeLimitMinutes ?? 0);
  const showFeedback = payload.showFeedback !== false;

  try {
    if (isNew) {
      await db.insert(dbQuizzes).values({
        id: quizId,
        topicId: toUuid(payload.topicId),
        lessonId: payload.lessonId ? toUuid(payload.lessonId) : null,
        createdBy: session?.id ? toUuid(session.id) : null,
        title,
        passingScore,
        timeLimitMinutes,
        showFeedback,
        createdAt: new Date(),
      });
    } else {
      // Permission check: teachers can only edit quizzes created by themselves
      if (session?.role !== "admin") {
        const existing = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizId));
        const userUuid = session?.id ? toUuid(session.id) : null;
        if (existing.length > 0 && existing[0].createdBy && existing[0].createdBy !== userUuid) {
          return { error: "Unauthorized: Teachers can only edit quizzes created by themselves." };
        }
      }

      await db
        .update(dbQuizzes)
        .set({
          topicId: toUuid(payload.topicId),
          lessonId: payload.lessonId ? toUuid(payload.lessonId) : null,
          title,
          passingScore,
          timeLimitMinutes,
          showFeedback,
        })
        .where(eq(dbQuizzes.id, quizId));

      // Delete previous questions (cascade deletes previous answers in DB)
      await db.delete(dbQuestions).where(eq(dbQuestions.quizId, quizId));
    }

    // Insert fresh questions & answers
    for (let qIdx = 0; qIdx < payload.questions.length; qIdx++) {
      const q = payload.questions[qIdx];
      const qId = crypto.randomUUID();
      const isAi = q.type === "open_ended" && Boolean(q.aiGradingEnabled);

      await db.insert(dbQuestions).values({
        id: qId,
        quizId,
        type: q.type || "multiple_choice",
        question: q.question.trim(),
        explanation: (q.explanation || "").trim(),
        orderNumber: qIdx + 1,
        maxMarks: q.maxMarks || 1,
        aiGradingEnabled: isAi,
        expectedAnswer: q.expectedAnswer ? q.expectedAnswer.trim() : null,
        keyConcepts: q.keyConcepts && q.keyConcepts.length > 0 ? q.keyConcepts : null,
        acceptableAnswers: q.acceptableAnswers && q.acceptableAnswers.length > 0 ? q.acceptableAnswers : null,
        commonMisconceptions: q.commonMisconceptions && q.commonMisconceptions.length > 0 ? q.commonMisconceptions : null,
        gradingRubric: q.gradingRubric && q.gradingRubric.length > 0 ? q.gradingRubric : null,
        createdAt: new Date(),
      });

      if (q.answers && q.answers.length > 0) {
        for (const ans of q.answers) {
          await db.insert(dbAnswers).values({
            id: crypto.randomUUID(),
            questionId: qId,
            answer: ans.answer.trim(),
            isCorrect: Boolean(ans.isCorrect),
            createdAt: new Date(),
          });
        }
      } else {
        // Fallback reference answer for open-ended questions without explicit choice items
        await db.insert(dbAnswers).values({
          id: crypto.randomUUID(),
          questionId: qId,
          answer: q.expectedAnswer?.trim() || "Reference Answer",
          isCorrect: true,
          createdAt: new Date(),
        });
      }
    }

    // Also update in-memory objects if present for backwards compatibility
    const memQuizIdx = INITIAL_QUIZZES.findIndex((q) => q.id === payload.id || q.id === quizId);
    if (memQuizIdx > -1) {
      INITIAL_QUIZZES[memQuizIdx].title = title;
      INITIAL_QUIZZES[memQuizIdx].passingScore = passingScore;
      INITIAL_QUIZZES[memQuizIdx].topicId = payload.topicId;
    } else {
      INITIAL_QUIZZES.push({
        id: quizId,
        topicId: payload.topicId,
        title,
        passingScore,
        showFeedback,
        createdAt: new Date().toISOString(),
      });
    }

    revalidatePath("/admin/quizzes");
    revalidatePath(`/admin/quizzes/${quizId}`);
    revalidatePath("/teacher/quizzes");
    revalidatePath(`/teacher/quizzes/${quizId}`);
    revalidatePath("/teacher/grading");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/quizzes");
    revalidatePath(`/dashboard/quizzes/${quizId}`);
    revalidatePath("/dashboard/subjects");
    revalidatePath("/dashboard/progress");

    return { success: true, quizId };
  } catch (err: any) {
    console.error("Failed to save quiz in database:", err);
    return { error: err.message || "Failed to save quiz in database. Please try again." };
  }
}

export async function editQuizWithQuestionsAction(
  quizId: string,
  title: string,
  passingScore: number,
  questions: any[]
) {
  // Find topicId from db or fallback
  const existingQuiz = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, toUuid(quizId)));
  const topicId = existingQuiz[0]?.topicId || INITIAL_TOPICS[0]?.id || "";

  return saveQuizWithQuestionsAction({
    id: quizId,
    topicId,
    title,
    passingScore,
    questions,
  });
}

/**
 * Check if the AI provider has been configured with an API key
 */
export async function checkAiConfigAction() {
  const config = getAiConfig();
  return {
    isConfigured: config.isConfigured,
    provider: config.provider,
    model: config.model,
  };
}

/**
 * Save or update the AI API key in .env and runtime environment
 */
export async function saveAiConfigAction(data: {
  apiKey: string;
  provider?: "gemini" | "openai";
  model?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin role required." };
  }

  const key = data.apiKey?.trim();
  if (!key) {
    return { error: "Please provide a valid API key." };
  }

  const provider = data.provider || "gemini";
  const model = data.model || (provider === "openai" ? "gpt-4o-mini" : "gemini-1.5-flash");

  try {
    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Set in runtime process.env immediately
    process.env.AI_PROVIDER = provider;
    process.env.AI_API_KEY = key;
    process.env.GEMINI_API_KEY = key;
    process.env.GEMINI_MODEL = model;
    process.env.AI_GRADING_MODEL = model;

    // Update .env file
    const updateOrAppend = (content: string, keyName: string, val: string) => {
      const regex = new RegExp(`^${keyName}=.*`, "m");
      if (regex.test(content)) {
        return content.replace(regex, `${keyName}="${val}"`);
      }
      return `${content.trim()}\n${keyName}="${val}"\n`;
    };

    let updated = updateOrAppend(envContent, "AI_PROVIDER", provider);
    updated = updateOrAppend(updated, "AI_API_KEY", key);
    updated = updateOrAppend(updated, "GEMINI_API_KEY", key);
    updated = updateOrAppend(updated, "GEMINI_MODEL", model);
    updated = updateOrAppend(updated, "AI_GRADING_MODEL", model);

    fs.writeFileSync(envPath, updated, "utf-8");

    return { success: true, message: "AI API Key configured successfully." };
  } catch (err: any) {
    console.error("Failed to save AI config:", err);
    return { error: "Failed to persist API key to .env file." };
  }
}

/**
 * Server action to automatically generate marking guide for open-ended question
 */
export async function generateMarkingGuideAction(input: {
  question: string;
  maxMarks: number;
  topicId?: string;
  lessonId?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin role required." };
  }

  if (!input.question?.trim()) {
    return { error: "Please enter a question statement first." };
  }

  const config = getAiConfig();
  if (!config.isConfigured) {
    return {
      error: "Google Gemini API Key is missing. Please enter your Gemini API Key to generate real, curriculum-aligned marking guides.",
      isConfigured: false,
    };
  }

  // Fetch topic and subject context if available
  let topicTitle = "";
  let subjectTitle = "";
  if (input.topicId) {
    try {
      const topicRecords = await db
        .select()
        .from(dbTopics)
        .where(eq(dbTopics.id, toUuid(input.topicId)));
      if (topicRecords.length > 0) {
        topicTitle = topicRecords[0].title;
        const subjectRecords = await db
          .select()
          .from(subjects)
          .where(eq(subjects.id, topicRecords[0].subjectId));
        if (subjectRecords.length > 0) {
          subjectTitle = subjectRecords[0].title;
        }
      }
    } catch {
      // Non-blocking context lookup
    }
  }

  try {
    const guide = await generateMarkingGuide({
      question: input.question.trim(),
      maxMarks: input.maxMarks || 4,
      topic: topicTitle,
      subject: subjectTitle,
    });

    return { success: true, guide, isConfigured: true };
  } catch (err: any) {
    console.error("Error generating marking guide:", err);
    return { error: err?.message || "Failed to generate marking guide. Please check your Gemini API key." };
  }
}

/**
 * Server action to preview and test AI grading on sample student answers
 */
export async function testAiGradingAction(input: {
  question: string;
  maxMarks: number;
  expectedAnswer: string;
  keyConcepts: string[];
  acceptableAnswers?: string[];
  misconceptions?: string[];
  rubric: Array<{ criterion: string; marks: number }>;
  sampleAnswer: string;
  topicId?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "admin" && session.role !== "teacher")) {
    return { error: "Unauthorized. Teacher or Admin role required." };
  }

  if (!input.sampleAnswer?.trim()) {
    return { error: "Please enter a sample answer to test." };
  }

  try {
    const preview = await evaluateStudentAnswer({
      question: input.question,
      maxMarks: input.maxMarks,
      expectedAnswer: input.expectedAnswer,
      keyConcepts: input.keyConcepts || [],
      acceptableAnswers: input.acceptableAnswers || [],
      misconceptions: input.misconceptions || [],
      rubric: input.rubric || [],
      studentAnswer: input.sampleAnswer.trim(),
    });

    return { success: true, preview };
  } catch (err: any) {
    console.error("Error testing AI grading:", err);
    return { error: err?.message || "Failed to evaluate sample answer." };
  }
}
