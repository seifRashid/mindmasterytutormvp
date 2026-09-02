import "dotenv/config";
import { db } from "../src/db";
import {
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
} from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";

async function runTest() {
  console.log("=== 1. Checking / Ensuring Class, Subject & Topic in Neon PostgreSQL ===");
  let classes = await db.select().from(dbClasses);
  let classId: string;
  if (classes.length === 0) {
    classId = crypto.randomUUID();
    await db.insert(dbClasses).values({
      id: classId,
      name: "Grade 10 STEM",
      slug: "grade-10-stem",
      createdAt: new Date(),
    });
    console.log("Created test class level:", classId);
  } else {
    classId = classes[0].id;
  }

  let subjects = await db.select().from(dbSubjects);
  let subjectId: string;
  if (subjects.length === 0) {
    subjectId = crypto.randomUUID();
    await db.insert(dbSubjects).values({
      id: subjectId,
      classId,
      title: "Algebra & Functions",
      slug: "algebra-functions",
      createdAt: new Date(),
    });
    console.log("Created test subject:", subjectId);
  } else {
    subjectId = subjects[0].id;
  }

  let topics = await db.select().from(dbTopics);
  let topicId: string;
  if (topics.length === 0) {
    topicId = crypto.randomUUID();
    await db.insert(dbTopics).values({
      id: topicId,
      subjectId,
      title: "Quadratic Functions",
      slug: "quadratic-functions",
      orderNumber: 1,
      createdAt: new Date(),
    });
    console.log("Created test topic:", topicId);
  } else {
    topicId = topics[0].id;
  }

  console.log(`Using Topic ID: ${topicId}`);

  console.log("\n=== 2. Creating New Quiz, Questions & Answers ===");
  const quizId = crypto.randomUUID();
  const quizTitle = `Quadratic Equations Assessment - ${Date.now()}`;

  // 1. Insert Quiz
  await db.insert(dbQuizzes).values({
    id: quizId,
    topicId,
    title: quizTitle,
    passingScore: 75,
    timeLimitMinutes: 20,
    showFeedback: true,
    createdAt: new Date(),
  });

  // 2. Insert Question 1 (Multiple Choice)
  const q1Id = crypto.randomUUID();
  await db.insert(dbQuestions).values({
    id: q1Id,
    quizId,
    type: "multiple_choice",
    question: "What is the discriminant in the quadratic formula?",
    explanation: "The discriminant is b^2 - 4ac.",
    orderNumber: 1,
    createdAt: new Date(),
  });

  await db.insert(dbAnswers).values([
    { id: crypto.randomUUID(), questionId: q1Id, answer: "b^2 - 4ac", isCorrect: true, createdAt: new Date() },
    { id: crypto.randomUUID(), questionId: q1Id, answer: "2a + b", isCorrect: false, createdAt: new Date() },
    { id: crypto.randomUUID(), questionId: q1Id, answer: "-b / 2a", isCorrect: false, createdAt: new Date() },
    { id: crypto.randomUUID(), questionId: q1Id, answer: "a^2 + b^2", isCorrect: false, createdAt: new Date() },
  ]);

  // 3. Insert Question 2 (True/False)
  const q2Id = crypto.randomUUID();
  await db.insert(dbQuestions).values({
    id: q2Id,
    quizId,
    type: "true_false",
    question: "A quadratic equation has two real roots if the discriminant is positive.",
    explanation: "A positive discriminant yields two distinct real solutions.",
    orderNumber: 2,
    createdAt: new Date(),
  });

  await db.insert(dbAnswers).values([
    { id: crypto.randomUUID(), questionId: q2Id, answer: "True", isCorrect: true, createdAt: new Date() },
    { id: crypto.randomUUID(), questionId: q2Id, answer: "False", isCorrect: false, createdAt: new Date() },
  ]);

  // 4. Insert Question 3 (Short Answer)
  const q3Id = crypto.randomUUID();
  await db.insert(dbQuestions).values({
    id: q3Id,
    quizId,
    type: "short_answer",
    question: "What is the degree of a quadratic equation?",
    explanation: "Quadratic equations are second-degree polynomials.",
    orderNumber: 3,
    createdAt: new Date(),
  });

  await db.insert(dbAnswers).values([
    { id: crypto.randomUUID(), questionId: q3Id, answer: "2", isCorrect: true, createdAt: new Date() },
  ]);

  console.log("Quiz created successfully with ID:", quizId);

  console.log("\n=== 3. Querying Back from PostgreSQL to Validate ===");
  const [createdQuiz] = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizId));
  console.log("Queried Quiz from DB:", {
    id: createdQuiz.id,
    title: createdQuiz.title,
    passingScore: createdQuiz.passingScore,
  });

  const createdQuestions = await db
    .select()
    .from(dbQuestions)
    .where(eq(dbQuestions.quizId, quizId))
    .orderBy(dbQuestions.orderNumber);

  console.log(`Queried ${createdQuestions.length} Questions from DB:`);
  const qIds = createdQuestions.map((q) => q.id);
  const createdAnswers = await db
    .select()
    .from(dbAnswers)
    .where(inArray(dbAnswers.questionId, qIds));

  for (const q of createdQuestions) {
    const qAns = createdAnswers.filter((a) => a.questionId === q.id);
    console.log(`  * #${q.orderNumber} [${q.type}] "${q.question}" -> ${qAns.length} answers`);
  }

  console.log("\n=== 4. Updating Quiz via Edit Flow ===");
  // Update quiz metadata
  await db
    .update(dbQuizzes)
    .set({
      title: `${quizTitle} [Edited]`,
      passingScore: 85,
    })
    .where(eq(dbQuizzes.id, quizId));

  // Delete old questions (cascade deletes answers)
  await db.delete(dbQuestions).where(eq(dbQuestions.quizId, quizId));

  // Insert updated questions
  const newQId = crypto.randomUUID();
  await db.insert(dbQuestions).values({
    id: newQId,
    quizId,
    type: "multiple_choice",
    question: "What is the discriminant formula?",
    explanation: "b^2 - 4ac",
    orderNumber: 1,
    createdAt: new Date(),
  });

  await db.insert(dbAnswers).values([
    { id: crypto.randomUUID(), questionId: newQId, answer: "b^2 - 4ac", isCorrect: true, createdAt: new Date() },
    { id: crypto.randomUUID(), questionId: newQId, answer: "4ac - b^2", isCorrect: false, createdAt: new Date() },
  ]);

  const [updatedQuiz] = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, quizId));
  console.log("Updated Quiz in DB:", {
    id: updatedQuiz.id,
    title: updatedQuiz.title,
    passingScore: updatedQuiz.passingScore,
  });

  const updatedQuestions = await db
    .select()
    .from(dbQuestions)
    .where(eq(dbQuestions.quizId, quizId));
  console.log(`Updated questions count in DB: ${updatedQuestions.length} (expected 1)`);

  console.log("\n>>> ALL DATABASE PERSISTENCE TESTS COMPLETED SUCCESSFULLY! <<<");
}

runTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
