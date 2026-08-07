import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Neon HTTP Client for Serverless Next.js Server Actions
const sql = neon(connectionString);
export const db = drizzleNeon(sql, { schema });
