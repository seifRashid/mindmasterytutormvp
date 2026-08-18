"use server";

import { revalidatePath } from "next/cache";
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
import { subjects, classes as dbClasses, topics as dbTopics, quizzes as dbQuizzes, questions as dbQuestions, answers as dbAnswers } from "@/db/schema";
import { toUuid } from "@/lib/id-mapper";
import { eq } from "drizzle-orm";

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
  return { success: true, classLevel: newClass };
}

export async function createSubjectAction(formData: FormData) {
  const classId = formData.get("classId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "BookOpen";

  if (!classId || !title) return { error: "Class and title are required" };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newSubject: Subject = {
    id: `sub-${Date.now()}`,
    classId,
    title,
    slug,
    description: description || "",
    icon,
    createdAt: new Date().toISOString(),
  };

  INITIAL_SUBJECTS.push(newSubject);

  try {
    await db.insert(subjects).values({
      id: toUuid(newSubject.id),
      classId: toUuid(classId),
      title: newSubject.title,
      slug: newSubject.slug,
      description: newSubject.description || null,
      icon: newSubject.icon,
      createdAt: new Date(newSubject.createdAt),
    });
  } catch (err) {
    console.error("Failed to insert subject in DB:", err);
    return { error: "Failed to create subject in database." };
  }

  revalidatePath("/admin/subjects");
  return { success: true, subject: newSubject };
}

export async function createTopicAction(formData: FormData) {
  const subjectId = formData.get("subjectId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  if (!subjectId || !title) return { error: "Subject and title are required" };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newTopic: Topic = {
    id: `top-${Date.now()}`,
    subjectId,
    title,
    slug,
    description: description || "",
    orderNumber: INITIAL_TOPICS.length + 1,
    createdAt: new Date().toISOString(),
  };

  INITIAL_TOPICS.push(newTopic);

  try {
    await db.insert(dbTopics).values({
      id: toUuid(newTopic.id),
      subjectId: toUuid(subjectId),
      title: newTopic.title,
      slug: newTopic.slug,
      description: newTopic.description || null,
      orderNumber: newTopic.orderNumber,
      createdAt: new Date(newTopic.createdAt),
    });
  } catch (err) {
    console.error("Failed to insert topic into DB:", err);
    return { error: "Failed to create topic in database." };
  }

  revalidatePath("/admin/topics");
  return { success: true, topic: newTopic };
}

export async function createLessonAction(formData: FormData) {
  const topicId = formData.get("topicId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const videoUrl = formData.get("videoUrl") as string;
  const duration = parseInt((formData.get("duration") as string) || "600", 10);

  if (!topicId || !title || !videoUrl) return { error: "Topic, title, and video URL are required" };

  const newLesson: Lesson = {
    id: `les-${Date.now()}`,
    topicId,
    title,
    description: description || "",
    videoUrl,
    duration,
    orderNumber: INITIAL_LESSONS.length + 1,
    createdAt: new Date().toISOString(),
  };

  INITIAL_LESSONS.push(newLesson);
  revalidatePath("/admin/lessons");
  revalidatePath("/teacher/lessons");
  return { success: true, lesson: newLesson };
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

  const quizId = `quiz-${Date.now()}`;
  const newQuiz: Quiz = {
    id: quizId,
    topicId,
    title,
    passingScore,
    showFeedback: true,
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
  } else if (entityType === "quiz") {
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
  revalidatePath("/teacher");
  return { success: true };
}

export async function editSubjectAction(formData: FormData) {
  const id = formData.get("id") as string;
  const classId = formData.get("classId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const icon = (formData.get("icon") as string) || "BookOpen";

  if (!id || !classId || !title) return { error: "ID, Class, and title are required" };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Update in-memory
  const idx = INITIAL_SUBJECTS.findIndex((s) => s.id === id);
  if (idx > -1) {
    INITIAL_SUBJECTS[idx] = {
      ...INITIAL_SUBJECTS[idx],
      classId,
      title,
      slug,
      description: description || "",
      icon,
    };
  }

  // Update DB
  try {
    await db
      .update(subjects)
      .set({
        classId: toUuid(classId),
        title,
        slug,
        description: description || null,
        icon,
      })
      .where(eq(subjects.id, toUuid(id)));
  } catch (err) {
    console.error("Failed to update subject in DB:", err);
    return { error: "Failed to update subject in database." };
  }

  revalidatePath("/admin/subjects");
  revalidatePath("/dashboard/subjects");
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
  return { success: true };
}

export async function editQuizWithQuestionsAction(
  quizId: string,
  title: string,
  passingScore: number,
  questions: any[]
) {
  if (!quizId || !title) return { error: "Quiz ID and title are required" };

  // 1. Update Quiz in memory
  const quizIdx = INITIAL_QUIZZES.findIndex((q) => q.id === quizId);
  if (quizIdx > -1) {
    INITIAL_QUIZZES[quizIdx].title = title;
    INITIAL_QUIZZES[quizIdx].passingScore = passingScore;
  }

  // Clear and insert questions in memory
  for (let i = INITIAL_QUESTIONS.length - 1; i >= 0; i--) {
    if (INITIAL_QUESTIONS[i].quizId === quizId) {
      INITIAL_QUESTIONS.splice(i, 1);
    }
  }

  // Re-populate questions in memory
  const mappedQuestions: Question[] = questions.map((q, qIdx) => {
    const qId = q.id.startsWith("q-new-") ? `q-${Date.now()}-${qIdx}` : q.id;
    return {
      id: qId,
      quizId,
      type: q.type || "multiple_choice",
      question: q.question,
      explanation: q.explanation || "",
      orderNumber: qIdx + 1,
      answers: (q.answers || []).map((ans: any, aIdx: number) => ({
        id: ans.id.startsWith("a-new-") || ans.id.includes("new") ? `a-${Date.now()}-${qIdx}-${aIdx}` : ans.id,
        questionId: qId,
        answer: ans.answer,
        isCorrect: ans.isCorrect,
      })),
    };
  });

  INITIAL_QUESTIONS.push(...mappedQuestions);

  // 2. Update DB
  try {
    await db
      .update(dbQuizzes)
      .set({ title, passingScore })
      .where(eq(dbQuizzes.id, toUuid(quizId)));

    await db
      .delete(dbQuestions)
      .where(eq(dbQuestions.quizId, toUuid(quizId)));

    for (const q of mappedQuestions) {
      await db.insert(dbQuestions).values({
        id: toUuid(q.id),
        quizId: toUuid(quizId),
        type: q.type,
        question: q.question,
        explanation: q.explanation,
        orderNumber: q.orderNumber,
        createdAt: new Date(),
      });

      for (const ans of q.answers) {
        await db.insert(dbAnswers).values({
          id: toUuid(ans.id),
          questionId: toUuid(q.id),
          answer: ans.answer,
          isCorrect: ans.isCorrect,
          createdAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.error("Failed to update quiz with questions in DB:", err);
    return { error: "Failed to save quiz in database." };
  }

  revalidatePath("/admin/quizzes");
  revalidatePath("/teacher/quizzes");
  return { success: true };
}
