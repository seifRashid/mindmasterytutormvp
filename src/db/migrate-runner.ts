import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as schema from "./schema";

async function runMigration() {
  const url = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("No database URL provided");
    process.exit(1);
  }

  console.log("Running migration via Neon HTTP driver...");
  const sql = neon(url);
  const db = drizzle(sql, { schema });

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations applied successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runMigration();
