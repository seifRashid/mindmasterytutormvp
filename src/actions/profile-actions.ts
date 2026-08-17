"use server";

import { getSession, setSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { mapDbUser, findUserById } from "@/lib/user-store";
import { revalidatePath } from "next/cache";

export async function updateProfileDetailsAction(data: {
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  classId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  image?: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "You must be logged in to update your profile." };
    }

    if (!data.name || !data.email) {
      return { error: "Name and email are required fields." };
    }

    const userUuid = toUuid(session.id);

    // 1. Check if email is already taken by another user
    const emailConflict = await db
      .select()
      .from(users)
      .where(and(eq(users.email, data.email.toLowerCase()), ne(users.id, userUuid)));

    if (emailConflict.length > 0) {
      return { error: "This email address is already in use by another account." };
    }

    // 2. Perform updates in database
    await db
      .update(users)
      .set({
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        age: data.age || null,
        gender: data.gender || null,
        classId: data.classId ? toUuid(data.classId) : null,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        parentEmail: data.parentEmail || null,
        image: data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userUuid));

    // 3. Fetch the fresh updated user details
    const updatedUser = await findUserById(session.id);
    if (!updatedUser) {
      return { error: "Failed to locate updated user profile." };
    }

    // 4. Update the active session cookie
    await setSession(updatedUser);

    revalidatePath("/admin/users");
    revalidatePath("/dashboard");
    revalidatePath("/teacher");
    revalidatePath("/admin");

    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error("Profile update error:", err);
    return { error: err.message || "An unexpected error occurred while updating your profile." };
  }
}

export async function updateProfilePasswordAction(data: {
  current: string;
  newPass: string;
}) {
  try {
    const session = await getSession();
    if (!session) {
      return { error: "You must be logged in to update your password." };
    }

    if (!data.current || !data.newPass) {
      return { error: "All password fields are required." };
    }

    const userUuid = toUuid(session.id);

    // 1. Fetch current user from database to check password hash
    const dbUserList = await db.select().from(users).where(eq(users.id, userUuid));
    if (dbUserList.length === 0) {
      return { error: "User account not found." };
    }
    const dbUser = dbUserList[0];

    // 2. Verify current password
    const isMatch = await comparePassword(data.current, dbUser.password);
    if (!isMatch) {
      return { error: "The current password you entered is incorrect." };
    }

    // 3. Hash and store the new password
    const hashed = await hashPassword(data.newPass);
    await db
      .update(users)
      .set({
        password: hashed,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userUuid));

    return { success: true };
  } catch (err: any) {
    console.error("Password update error:", err);
    return { error: err.message || "An unexpected error occurred while changing your password." };
  }
}
