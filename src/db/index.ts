import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const isDevOrPreview =
  process.env.NODE_ENV === "development" ||
  process.env.VERCEL_ENV === "preview" ||
  process.env.VERCEL_ENV === "development";

const connectionString =
  (isDevOrPreview ? process.env.DEV_DATABASE_URL : null) ||
  process.env.DATABASE_URL ||
  "postgresql://dummy:dummy@dummy-pooler.dummy.tech/neondb";

// Neon HTTP Client for Serverless Next.js Server Actions
const sql = neon(connectionString);
export const db = drizzleNeon(sql, { schema });
