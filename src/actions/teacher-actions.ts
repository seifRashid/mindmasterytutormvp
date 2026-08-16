"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lessons as dbLessons } from "@/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

/**
 * Automatically purge lessons from the recycle bin that were deleted more than 2 days (48 hours) ago.
 */
export async function purgeExpiredRecycleBin() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 2); // 2 days ago

    await db
      .delete(dbLessons)
      .where(and(isNotNull(dbLessons.deletedAt), lt(dbLessons.deletedAt, cutoff)));
  } catch (err) {
    console.error("Failed to purge expired lessons from recycle bin:", err);
  }
}

/**
 * Soft deletes a lesson by setting its deletedAt timestamp.
 */
export async function softDeleteLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db
      .update(dbLessons)
      .set({ deletedAt: new Date() })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to soft delete lesson:", err);
    return { success: false, error: "Failed to delete lesson." };
  }
}

/**
 * Restores a soft-deleted lesson by nullifying its deletedAt timestamp.
 */
export async function restoreLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db
      .update(dbLessons)
      .set({ deletedAt: null })
      .where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to restore lesson:", err);
    return { success: false, error: "Failed to restore lesson." };
  }
}

/**
 * Permanently deletes a lesson from the database.
 */
export async function permanentlyDeleteLessonAction(lessonId: string) {
  try {
    const lessonUuid = toUuid(lessonId);
    await db.delete(dbLessons).where(eq(dbLessons.id, lessonUuid));

    revalidatePath("/teacher/lessons");
    revalidatePath("/admin/lessons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Failed to permanently delete lesson:", err);
    return { success: false, error: "Failed to permanently delete lesson." };
  }
}
