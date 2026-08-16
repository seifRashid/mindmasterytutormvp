import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { LessonBuilder } from "@/components/admin/LessonBuilder";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  lessons as dbLessons,
  lessonAttachments as dbAttachments,
  topics as dbTopics,
  subjects as dbSubjects,
  classes as dbClasses,
  quizzes as dbQuizzes,
  questions as dbQuestions,
  answers as dbAnswers,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export default async function TeacherLessonBuilderPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await getSession();
  const { lessonId } = await params;

  const lessonUuid = toUuid(lessonId);

  // Fetch lesson
  const lessonsList = await db.select().from(dbLessons).where(eq(dbLessons.id, lessonUuid));
  if (lessonsList.length === 0) notFound();
  const lesson = lessonsList[0];

  // Fetch attachments
  const attachmentsList = await db
    .select()
    .from(dbAttachments)
    .where(eq(dbAttachments.lessonId, lessonUuid));

  const fullLesson = {
    ...lesson,
    attachments: attachmentsList,
  };

  // Fetch topic, subject, class level
  let topic = null;
  let subject = null;
  let classLevel = null;
  if (lesson.topicId) {
    const topicResult = await db.select().from(dbTopics).where(eq(dbTopics.id, lesson.topicId));
    if (topicResult.length > 0) {
      topic = topicResult[0];
      if (topic.subjectId) {
        const subjectResult = await db.select().from(dbSubjects).where(eq(dbSubjects.id, topic.subjectId));
        if (subjectResult.length > 0) {
          subject = subjectResult[0];
          if (subject.classId) {
            const classResult = await db.select().from(dbClasses).where(eq(dbClasses.id, subject.classId));
            if (classResult.length > 0) {
              classLevel = classResult[0];
            }
          }
        }
      }
    }
  }

  // Fetch quiz & questions
  let quiz = undefined;
  let questionsList: any[] = [];
  if (lesson.lessonQuizId) {
    const quizResult = await db.select().from(dbQuizzes).where(eq(dbQuizzes.id, lesson.lessonQuizId));
    if (quizResult.length > 0) {
      quiz = quizResult[0];
      const qs = await db
        .select()
        .from(dbQuestions)
        .where(eq(dbQuestions.quizId, quiz.id))
        .orderBy(dbQuestions.orderNumber);

      if (qs.length > 0) {
        const qIds = qs.map((q) => q.id);
        const ans = await db.select().from(dbAnswers).where(inArray(dbAnswers.questionId, qIds));
        questionsList = qs.map((q) => ({
          ...q,
          answers: ans.filter((a) => a.questionId === q.id),
        }));
      }
    }
  }

  // Fetch all topic choices for dropdown selector
  const allTopicsList = await db.select().from(dbTopics).orderBy(dbTopics.orderNumber);
  const topicOptions = allTopicsList.map((t) => ({ id: t.id, title: t.title }));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
      <Navbar user={session} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-x-hidden">
        <Sidebar role="teacher" />

        <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Link href="/teacher/lessons" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Lessons
            </Link>
            {classLevel && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{classLevel.name}</span>
              </>
            )}
            {subject && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{subject.title}</span>
              </>
            )}
            {topic && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>{topic.title}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs">
              {lesson.title}
            </span>
          </div>

          {/* Lesson Builder */}
          <LessonBuilder
            lesson={fullLesson as any}
            quiz={quiz as any}
            questions={questionsList}
            topics={topicOptions}
          />
        </main>
      </div>
    </div>
  );
}
