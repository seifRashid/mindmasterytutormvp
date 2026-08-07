"use server";

import { redirect } from "next/navigation";
import { clearSession, setSession } from "@/lib/auth";
import { INITIAL_USERS, User } from "@/lib/mock-data";

// Simulated user storage array for runtime fallback
const usersStore: User[] = [...INITIAL_USERS];

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return;
  }

  const user = usersStore.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || user.password !== password) {
    return;
  }

  await setSession(user);

  // Redirect based on role
  if (user.role === "admin") {
    redirect("/admin");
  } else if (user.role === "teacher") {
    redirect("/teacher");
  } else {
    redirect("/dashboard");
  }
}

export async function registerStudentAction(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return;
  }

  const existing = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return;
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role: "student",
    createdAt: new Date().toISOString(),
  };

  usersStore.push(newUser);
  await setSession(newUser);
  redirect("/dashboard");
}

export async function registerTeacherAction(formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return;
  }

  const existing = usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return;
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role: "teacher",
    createdAt: new Date().toISOString(),
  };

  usersStore.push(newUser);
  await setSession(newUser);
  redirect("/teacher");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
