import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import * as schema from "./schema";

async function runMigration() {
  const urls = [
    { name: "DATABASE_URL", val: process.env.DATABASE_URL },
    { name: "DEV_DATABASE_URL", val: process.env.DEV_DATABASE_URL },
  ].filter((item) => Boolean(item.val));

  if (urls.length === 0) {
    console.error("No database URL provided");
    process.exit(1);
  }

  for (const { name, val } of urls) {
    const cleanUrl = val!.trim().replace("-pooler", "");
    console.log(`Running migration for ${name}...`);
    try {
      const sql = neon(cleanUrl);
      const db = drizzle(sql, { schema });
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log(`✅ Migrations applied successfully to ${name}!`);
    } catch (err) {
      console.error(`Migration error for ${name}:`, err);
    }
  }
}

runMigration();
