import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("user_role", ["student", "teacher", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "approved", "rejected"]);
export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "true_false",
  "short_answer",
]);
export const attachmentTypeEnum = pgEnum("attachment_type", [
  "pdf",
  "doc",
  "image",
  "link",
  "presentation",
  "other",
]);
// NEW: lesson status is now a real enum instead of free-text varchar
export const lessonStatusEnum = pgEnum("lesson_status", ["draft", "published"]);
// NEW: for password reset / email verification flows
export const authTokenTypeEnum = pgEnum("auth_token_type", [
  "email_verification",
  "password_reset",
]);

// 1. Users Table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    // RENAMED from "password" -> "passwordHash" so it's never mistaken for
    // a place to put plaintext. App layer must hash with bcrypt/argon2 before insert.
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").default("student").notNull(),
    status: userStatusEnum("status").default("pending").notNull(),
    phone: varchar("phone", { length: 50 }),
    age: integer("age"),
    gender: varchar("gender", { length: 20 }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    parentName: varchar("parent_name", { length: 255 }),
    parentPhone: varchar("parent_phone", { length: 50 }),
    parentEmail: varchar("parent_email", { length: 255 }),
    notes: text("notes"),
    rejectionReason: text("rejection_reason"),
    image: text("image"),

    // NEW: account-security fields
    emailVerified: boolean("email_verified").default(false).notNull(),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    lastLoginAt: timestamp("last_login_at"),
    passwordChangedAt: timestamp("password_changed_at"),

    // NEW: admin accountability for approve/reject workflow
    approvedBy: uuid("approved_by"),
    approvedAt: timestamp("approved_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
    statusIdx: index("users_status_idx").on(table.status),
    classIdIdx: index("users_class_id_idx").on(table.classId),
    // NEW: defense-in-depth format/range checks at the DB layer
    ageCheck: check("users_age_check", sql`${table.age} IS NULL OR (${table.age} BETWEEN 3 AND 120)`),
    emailFormatCheck: check(
      "users_email_format_check",
      sql`${table.email} ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`
    ),
  })
);

// NEW: Auth tokens table — for email verification & password reset,
// so raw tokens are never embedded in URLs without expiry/one-time-use tracking.
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(), // store hash of token, not the raw token
    type: authTokenTypeEnum("type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("auth_tokens_user_idx").on(table.userId),
    tokenHashIdx: uniqueIndex("auth_tokens_token_hash_idx").on(table.tokenHash),
  })
);

// 2. Classes Table
export const classes = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("classes_slug_idx").on(table.slug),
  })
);

// 3. Subjects Table
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 100 }).default("BookOpen"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    classIdx: index("subjects_class_idx").on(table.classId),
    // FIXED: slug uniqueness scoped per class, not global
    classSlugUnique: uniqueIndex("subjects_class_slug_unique").on(table.classId, table.slug),
  })
);

// 4. Topics Table
export const topics = pgTable(
  "topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    orderNumber: integer("order_number").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    subjectIdx: index("topics_subject_idx").on(table.subjectId),
    orderIdx: index("topics_order_idx").on(table.orderNumber),
    // FIXED: slug uniqueness scoped per subject
    subjectSlugUnique: uniqueIndex("topics_subject_slug_unique").on(table.subjectId, table.slug),
  })
);

// 5. Lessons Table
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    richContent: text("rich_content"),
    videoUrl: text("video_url"),
    duration: integer("duration").default(0).notNull(),
    orderNumber: integer("order_number").default(1).notNull(),
    // REMOVED lessonQuizId: it was a dangling FK with no .references() and
    // duplicated the relationship already modeled by quizzes.lessonId below.
    // A lesson's quiz is now found via quizzes.lessonId (one lesson -> one quiz).
    deletedAt: timestamp("deleted_at"),
    // FIXED: real enum instead of unvalidated varchar
    status: lessonStatusEnum("status").default("published").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    topicIdx: index("lessons_topic_idx").on(table.topicId),
  })
);

// 6. Lesson Attachments Table
export const lessonAttachments = pgTable(
  "lesson_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    url: text("url").notNull(),
    fileType: attachmentTypeEnum("file_type").default("other").notNull(),
    orderNumber: integer("order_number").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    lessonIdx: index("lesson_attachments_lesson_idx").on(table.lessonId),
  })
);

// 7. Quizzes Table
export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    topicId: uuid("topic_id").references(() => topics.id, { onDelete: "cascade" }),
    // FIXED: lessonId now cascades to "restrict" so a quiz with existing
    // student attempts can't be deleted along with its lesson by accident.
    // Prefer soft-deleting quizzes/lessons over hard delete when history exists.
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    passingScore: integer("passing_score").default(70).notNull(),
    timeLimitMinutes: integer("time_limit_minutes").default(0).notNull(),
    showFeedback: boolean("show_feedback").default(true).notNull(),
    deletedAt: timestamp("deleted_at"), // NEW: soft delete, preserves attempt history
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    topicIdx: index("quizzes_topic_idx").on(table.topicId),
    lessonIdx: index("quizzes_lesson_idx").on(table.lessonId),
    passingScoreCheck: check(
      "quizzes_passing_score_check",
      sql`${table.passingScore} BETWEEN 0 AND 100`
    ),
  })
);

// 8. Questions Table
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    type: questionTypeEnum("type").default("multiple_choice").notNull(),
    question: text("question").notNull(),
    explanation: text("explanation").notNull(),
    orderNumber: integer("order_number").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    quizIdx: index("questions_quiz_idx").on(table.quizId),
  })
);

// 9. Answers Table
export const answers = pgTable(
  "answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    isCorrect: boolean("is_correct").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    questionIdx: index("answers_question_idx").on(table.questionId),
  })
);

// 10. Quiz Attempts Table
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // FIXED: restrict instead of cascade — deleting a quiz should not be
    // able to silently erase every student's historical score for it.
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "restrict" }),
    score: integer("score").notNull(),
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userQuizIdx: index("quiz_attempts_user_quiz_idx").on(table.userId, table.quizId),
    scoreCheck: check("quiz_attempts_score_check", sql`${table.score} BETWEEN 0 AND 100`),
  })
);

// 11. Lesson Progress Table
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // FIXED: restrict instead of cascade — same reasoning as quizAttempts.quizId above.
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "restrict" }),
    completed: boolean("completed").default(false).notNull(),
    notesCompleted: boolean("notes_completed").default(false).notNull(),
    videoCompleted: boolean("video_completed").default(false).notNull(),
    materialsCompleted: boolean("materials_completed").default(false).notNull(),
    watchedDuration: integer("watched_duration").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // FIXED: unique, not just indexed — one progress row per (user, lesson)
    userLessonUnique: uniqueIndex("lesson_progress_user_lesson_unique").on(
      table.userId,
      table.lessonId
    ),
  })
);

// ─── RELATIONS ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  class: one(classes, { fields: [users.classId], references: [classes.id] }),
  quizAttempts: many(quizAttempts),
  lessonProgress: many(lessonProgress),
  authTokens: many(authTokens),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  user: one(users, { fields: [authTokens.userId], references: [users.id] }),
}));

export const classesRelations = relations(classes, ({ many }) => ({
  subjects: many(subjects),
  students: many(users),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  class: one(classes, { fields: [subjects.classId], references: [classes.id] }),
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, { fields: [topics.subjectId], references: [subjects.id] }),
  lessons: many(lessons),
  quizzes: many(quizzes),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  topic: one(topics, { fields: [lessons.topicId], references: [topics.id] }),
  progress: many(lessonProgress),
  attachments: many(lessonAttachments),
  quiz: many(quizzes),
}));

export const lessonAttachmentsRelations = relations(lessonAttachments, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonAttachments.lessonId], references: [lessons.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  topic: one(topics, { fields: [quizzes.topicId], references: [topics.id] }),
  lesson: one(lessons, { fields: [quizzes.lessonId], references: [lessons.id] }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
}));
