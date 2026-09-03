ALTER TYPE "public"."question_type" ADD VALUE IF NOT EXISTS 'open_ended';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_answer_id" uuid,
	"text_answer" text,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 1 NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"grading_status" varchar(50) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_grading_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_attempt_answer_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"status" varchar(50) NOT NULL,
	"confidence" real NOT NULL,
	"criteria_results" jsonb NOT NULL,
	"missing_concepts" jsonb,
	"detected_misconceptions" jsonb,
	"feedback" text NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_version" varchar(50) DEFAULT 'v1' NOT NULL,
	"requires_teacher_review" boolean DEFAULT false NOT NULL,
	"teacher_score" integer,
	"teacher_feedback" text,
	"teacher_reviewed_at" timestamp,
	"teacher_reviewed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "notes_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "video_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN IF NOT EXISTS "materials_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "max_marks" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "ai_grading_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "expected_answer" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "key_concepts" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "acceptable_answers" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "common_misconceptions" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "grading_rubric" jsonb;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "total_marks" integer;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "max_total_marks" integer;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "created_by" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_quiz_attempt_answer_id_quiz_attempt_answers_id_fk" FOREIGN KEY ("quiz_attempt_answer_id") REFERENCES "public"."quiz_attempt_answers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ai_grading_results" ADD CONSTRAINT "ai_grading_results_teacher_reviewed_by_users_id_fk" FOREIGN KEY ("teacher_reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_selected_answer_id_answers_id_fk" FOREIGN KEY ("selected_answer_id") REFERENCES "public"."answers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_grading_results_answer_idx" ON "ai_grading_results" USING btree ("quiz_attempt_answer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_grading_results_question_idx" ON "ai_grading_results" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_grading_results_student_idx" ON "ai_grading_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_grading_results_review_idx" ON "ai_grading_results" USING btree ("requires_teacher_review");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempt_answers_attempt_idx" ON "quiz_attempt_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempt_answers_question_idx" ON "quiz_attempt_answers" USING btree ("question_id");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;