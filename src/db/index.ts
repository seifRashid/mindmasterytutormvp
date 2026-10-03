import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const isDevOrPreview =
  process.env.NODE_ENV === "development" ||
  process.env.VERCEL_ENV === "preview" ||
  process.env.VERCEL_ENV === "development";

const devUrl = process.env.DEV_DATABASE_URL?.trim();
const prodUrl = process.env.DATABASE_URL?.trim();
const connectionString =
  (isDevOrPreview ? devUrl : null) ||
  prodUrl ||
  "postgresql://dummy:dummy@dummy-pooler.dummy.tech/neondb";

// Neon HTTP Client for Serverless Next.js Server Actions
// Note: neon() HTTP driver queries compute directly, not through -pooler
const httpConnectionString = connectionString.replace("-pooler", "");
const sql = neon(httpConnectionString);
export const db = drizzleNeon(sql, { schema });
