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
    createdAt: new Date().toISOString(),
  };

  INITIAL_QUIZZES.push(newQuiz);

  const questionId = `q-${Date.now()}`;
  const options = [optA, optB, optC, optD].filter(Boolean);

  const newQuestion: Question = {
    id: questionId,
    quizId,
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

  revalidatePath("/admin/quizzes");
  revalidatePath("/teacher/quizzes");
  return { success: true, quiz: newQuiz };
}

export async function deleteEntityAction(entityType: "class" | "subject" | "topic" | "lesson" | "quiz", id: string) {
  if (entityType === "class") {
    const idx = INITIAL_CLASSES.findIndex((c) => c.id === id);
    if (idx > -1) INITIAL_CLASSES.splice(idx, 1);
  } else if (entityType === "subject") {
    const idx = INITIAL_SUBJECTS.findIndex((s) => s.id === id);
    if (idx > -1) INITIAL_SUBJECTS.splice(idx, 1);
  } else if (entityType === "topic") {
    const idx = INITIAL_TOPICS.findIndex((t) => t.id === id);
    if (idx > -1) INITIAL_TOPICS.splice(idx, 1);
  } else if (entityType === "lesson") {
    const idx = INITIAL_LESSONS.findIndex((l) => l.id === id);
    if (idx > -1) INITIAL_LESSONS.splice(idx, 1);
  } else if (entityType === "quiz") {
    const idx = INITIAL_QUIZZES.findIndex((q) => q.id === id);
    if (idx > -1) INITIAL_QUIZZES.splice(idx, 1);
  }

  revalidatePath("/admin");
  revalidatePath("/teacher");
  return { success: true };
}
