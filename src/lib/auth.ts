import { cookies } from "next/headers";
import { INITIAL_USERS, User } from "./mock-data";

const COOKIE_NAME = "mindmastery_session";

export interface SessionData {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  image?: string;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    // Default fallback to student session for immediate preview convenience
    return {
      id: "user-student-1",
      name: "David Kim",
      email: "student@mindmastery.edu",
      role: "student",
      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    };
  }

  try {
    const data = JSON.parse(decodeURIComponent(sessionCookie.value)) as SessionData;
    return data;
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
