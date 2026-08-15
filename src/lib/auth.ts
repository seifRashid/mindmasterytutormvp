import { cookies } from "next/headers";
import { User } from "./types";
import { findUserById } from "./user-store";

const COOKIE_NAME = "mindmastery_session";

export interface SessionData {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status?: "pending" | "approved" | "rejected";
  classId?: string;
  rejectionReason?: string;
  image?: string;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const data = JSON.parse(decodeURIComponent(sessionCookie.value)) as SessionData;
    
    // Fetch fresh user data from database to reflect any status or role changes
    const dbUser = await findUserById(data.id);
    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status ?? "approved",
      classId: dbUser.classId,
      rejectionReason: dbUser.rejectionReason,
      image: dbUser.image,
    };
  } catch {
    return null;
  }
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: SessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status ?? "approved",
    classId: user.classId,
    rejectionReason: user.rejectionReason,
    image: user.image,
  };

  cookieStore.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(sessionData)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireRole(allowedRoles: ("student" | "teacher" | "admin")[]) {
  const session = await getSession();
  if (!session || !allowedRoles.includes(session.role)) {
    return null;
  }
  return session;
}
