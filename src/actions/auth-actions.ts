"use server";

import { redirect } from "next/navigation";
import { clearSession, setSession } from "@/lib/auth";
import { User } from "@/lib/mock-data";
import { addUser, findUserByEmail, findUserById } from "@/lib/user-store";
import { revalidatePath } from "next/cache";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toUuid } from "@/lib/id-mapper";

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return;
  }

  const user = await findUserByEmail(email);

  if (!user || !user.password || !(await comparePassword(password, user.password))) {
    return;
  }

  await setSession(user);

  // Redirect based on role and account status
  if (user.role === "admin") {
    redirect("/admin");
  } else if (user.role === "teacher") {
    redirect("/teacher");
  } else {
    // If student account is pending or rejected, send to pending page
    if (user.status === "pending" || user.status === "rejected") {
      redirect("/pending-approval");
    }
    redirect("/dashboard");
  }
}

export async function registerStudentAction(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const phone = (formData.get("phone") as string) || undefined;
  const age = formData.get("age") ? Number(formData.get("age")) : undefined;
  const gender = (formData.get("gender") as "male" | "female" | "other") || undefined;
  const classId = (formData.get("classId") as string) || undefined;
  const parentName = (formData.get("parentName") as string) || undefined;
  const parentPhone = (formData.get("parentPhone") as string) || undefined;
  const parentEmail = (formData.get("parentEmail") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  if (!name || !email || !password) {
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return;
  }

  const hashedPassword = await hashPassword(password);

  const newUser: User = {
    id: `user-student-${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role: "student",
    status: "pending", // Account starts in Pending Approval state
    phone,
    age,
    gender,
    classId,
    parentName,
    parentPhone,
    parentEmail,
    notes,
    createdAt: new Date().toISOString(),
  };

  await addUser(newUser);
  await setSession(newUser);
  redirect("/pending-approval");
}

export async function registerTeacherAction(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return;
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return;
  }

  const hashedPassword = await hashPassword(password);

  const newUser: User = {
    id: `user-teacher-${Date.now()}`,
    name,
    email,
    password: hashedPassword,
    role: "teacher",
    status: "approved",
    createdAt: new Date().toISOString(),
  };

  await addUser(newUser);
  await setSession(newUser);
  redirect("/teacher");
}

export async function approveStudentAction(studentId: string): Promise<{ success: boolean; message: string }> {
  const student = await findUserById(studentId);
  if (!student) {
    return { success: false, message: "Student not found" };
  }

  await db
    .update(users)
    .set({ status: "approved", rejectionReason: null })
    .where(eq(users.id, toUuid(studentId)));

  revalidatePath("/admin/approvals");
  revalidatePath("/teacher/approvals");
  revalidatePath("/admin/users");
  return { success: true, message: `Approved ${student.name}'s account!` };
}

export async function rejectStudentAction(studentId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const student = await findUserById(studentId);
  if (!student) {
    return { success: false, message: "Student not found" };
  }

  const finalReason = reason || "Application did not meet registration criteria.";
  await db
    .update(users)
    .set({ status: "rejected", rejectionReason: finalReason })
    .where(eq(users.id, toUuid(studentId)));

  revalidatePath("/admin/approvals");
  revalidatePath("/teacher/approvals");
  revalidatePath("/admin/users");
  return { success: true, message: `Rejected ${student.name}'s account.` };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
