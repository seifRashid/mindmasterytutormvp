import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  INITIAL_CLASSES,
  INITIAL_USERS,
  INITIAL_SUBJECTS,
  INITIAL_TOPICS,
  INITIAL_LESSONS,
  INITIAL_QUIZZES,
  INITIAL_QUESTIONS,
} from "../lib/mock-data";
import { toUuid } from "../lib/id-mapper";
import { hashPassword } from "../lib/crypto";

// Load environment variables
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables!");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding database with full mock data...");

  try {
    // 1. Clean existing records in dependency order (children first)
    console.log("Cleaning existing records...");
    await db.delete(schema.answers);
    await db.delete(schema.questions);
    await db.delete(schema.quizzes);
    await db.delete(schema.lessonAttachments);
    await db.delete(schema.lessons);
    await db.delete(schema.topics);
    await db.delete(schema.subjects);
    await db.delete(schema.users);
    await db.delete(schema.classes);

    // 2. Seed Classes
    console.log("Seeding classes...");
    for (const c of INITIAL_CLASSES) {
      await db.insert(schema.classes).values({
        id: toUuid(c.id),
        name: c.name,
        slug: c.slug,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_CLASSES.length} classes.`);

    // 3. Seed Users (with hashed passwords)
    console.log("Seeding users...");
    for (const u of INITIAL_USERS) {
      const plainPassword = u.password || "password123";
      const hashedPassword = await hashPassword(plainPassword);

      await db.insert(schema.users).values({
        id: toUuid(u.id),
        name: u.name,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        role: u.role,
        status: u.status || "approved",
        phone: u.phone || null,
        age: u.age || null,
        gender: u.gender || null,
        classId: u.classId ? toUuid(u.classId) : null,
        parentName: u.parentName || null,
        parentPhone: u.parentPhone || null,
        parentEmail: u.parentEmail || null,
        notes: u.notes || null,
        rejectionReason: u.rejectionReason || null,
        image: u.image || null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_USERS.length} users.`);

    // 4. Seed Subjects
    console.log("Seeding subjects...");
    for (const sub of INITIAL_SUBJECTS) {
      await db.insert(schema.subjects).values({
        id: toUuid(sub.id),
        classId: toUuid(sub.classId),
        title: sub.title,
        slug: sub.slug,
        description: sub.description || null,
        icon: sub.icon || "BookOpen",
        createdAt: sub.createdAt ? new Date(sub.createdAt) : new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_SUBJECTS.length} subjects.`);

    // 5. Seed Topics
    console.log("Seeding topics...");
    for (const top of INITIAL_TOPICS) {
      await db.insert(schema.topics).values({
        id: toUuid(top.id),
        subjectId: toUuid(top.subjectId),
        title: top.title,
        slug: top.slug,
        description: top.description || null,
        orderNumber: top.orderNumber || 1,
        createdAt: top.createdAt ? new Date(top.createdAt) : new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_TOPICS.length} topics.`);

    // 6. Seed Lessons & Attachments
    console.log("Seeding lessons & attachments...");
    for (const les of INITIAL_LESSONS) {
      await db.insert(schema.lessons).values({
        id: toUuid(les.id),
        topicId: toUuid(les.topicId),
        title: les.title,
        description: les.description || null,
        richContent: les.richContent || null,
        videoUrl: les.videoUrl || null,
        duration: les.duration || 0,
        orderNumber: les.orderNumber || 1,
        lessonQuizId: les.lessonQuizId ? toUuid(les.lessonQuizId) : null,
        createdAt: les.createdAt ? new Date(les.createdAt) : new Date(),
      });

      if (les.attachments && les.attachments.length > 0) {
        for (const att of les.attachments) {
          await db.insert(schema.lessonAttachments).values({
            id: toUuid(att.id),
            lessonId: toUuid(att.lessonId),
            name: att.name,
            url: att.url,
            fileType: att.type,
            orderNumber: att.orderNumber || 1,
            createdAt: new Date(),
          });
        }
      }
    }
    console.log(`Seeded ${INITIAL_LESSONS.length} lessons.`);

    // 7. Seed Quizzes
    console.log("Seeding quizzes...");
    for (const quiz of INITIAL_QUIZZES) {
      await db.insert(schema.quizzes).values({
        id: toUuid(quiz.id),
        topicId: quiz.topicId ? toUuid(quiz.topicId) : null,
        lessonId: quiz.lessonId ? toUuid(quiz.lessonId) : null,
        title: quiz.title,
        passingScore: quiz.passingScore || 70,
        timeLimitMinutes: quiz.timeLimitMinutes || 0,
        showFeedback: quiz.showFeedback !== undefined ? quiz.showFeedback : true,
        createdAt: quiz.createdAt ? new Date(quiz.createdAt) : new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_QUIZZES.length} quizzes.`);

    // 8. Seed Questions & Answers
    console.log("Seeding questions & answers...");
    for (const q of INITIAL_QUESTIONS) {
      await db.insert(schema.questions).values({
        id: toUuid(q.id),
        quizId: toUuid(q.quizId),
        type: q.type || "multiple_choice",
        question: q.question,
        explanation: q.explanation,
        orderNumber: q.orderNumber || 1,
        createdAt: new Date(),
      });

      if (q.answers && q.answers.length > 0) {
        for (const ans of q.answers) {
          await db.insert(schema.answers).values({
            id: toUuid(ans.id),
            questionId: toUuid(ans.questionId),
            answer: ans.answer,
            isCorrect: ans.isCorrect || false,
            createdAt: new Date(),
          });
        }
      }
    }
    console.log(`Seeded ${INITIAL_QUESTIONS.length} questions and their answers.`);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
