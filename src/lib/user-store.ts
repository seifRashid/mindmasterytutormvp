import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { toUuid, fromUuid } from "./id-mapper";
import { User } from "./mock-data";

// Keep usersStore as a legacy fallback/empty array to prevent compile errors
// while we transition remaining imports.
export const usersStore: User[] = [];

// Map database user to frontend User type
export function mapDbUser(dbUser: typeof users.$inferSelect): User {
  return {
    id: fromUuid(dbUser.id),
    name: dbUser.name,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role as "student" | "teacher" | "admin",
    status: dbUser.status as "pending" | "approved" | "rejected",
    phone: dbUser.phone || undefined,
    age: dbUser.age || undefined,
    gender: (dbUser.gender as "male" | "female" | "other") || undefined,
    classId: dbUser.classId ? fromUuid(dbUser.classId) : undefined,
    parentName: dbUser.parentName || undefined,
    parentPhone: dbUser.parentPhone || undefined,
    parentEmail: dbUser.parentEmail || undefined,
    notes: dbUser.notes || undefined,
    rejectionReason: dbUser.rejectionReason || undefined,
    image: dbUser.image || undefined,
    createdAt: dbUser.createdAt.toISOString(),
  };
}

export async function getUsers(): Promise<User[]> {
  const dbUsers = await db.select().from(users);
  return dbUsers.map(mapDbUser);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  return dbUser ? mapDbUser(dbUser) : undefined;
}

export async function findUserById(id: string): Promise<User | undefined> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, toUuid(id)),
  });
  return dbUser ? mapDbUser(dbUser) : undefined;
}

export async function addUser(user: User): Promise<void> {
  await db.insert(users).values({
    id: toUuid(user.id),
    name: user.name,
    email: user.email.toLowerCase(),
    password: user.password || "",
    role: user.role,
    status: user.status || "pending",
    phone: user.phone || null,
    age: user.age || null,
    gender: user.gender || null,
    classId: user.classId ? toUuid(user.classId) : null,
    parentName: user.parentName || null,
    parentPhone: user.parentPhone || null,
    parentEmail: user.parentEmail || null,
    notes: user.notes || null,
    rejectionReason: user.rejectionReason || null,
    image: user.image || null,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: new Date(),
  });
}
