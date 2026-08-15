import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { hashPassword } from "../lib/crypto";
import { ne, eq } from "drizzle-orm";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set!");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🧹 Cleaning production database...");
  console.log("   Keeping: admin users");
  console.log("   Removing: all test data, content, non-admin users\n");

  try {
    // 1. Remove all user-generated progress & attempt records
    console.log("Deleting quiz attempts...");
    await db.delete(schema.quizAttempts);

    console.log("Deleting lesson progress...");
    await db.delete(schema.lessonProgress);

    // 2. Remove all content (dependency order: deepest children first)
    console.log("Deleting answers...");
    await db.delete(schema.answers);

    console.log("Deleting questions...");
    await db.delete(schema.questions);

    console.log("Deleting quizzes...");
    await db.delete(schema.quizzes);

    console.log("Deleting lesson attachments...");
    await db.delete(schema.lessonAttachments);

    console.log("Deleting lessons...");
    await db.delete(schema.lessons);

    console.log("Deleting topics...");
    await db.delete(schema.topics);

    console.log("Deleting subjects...");
    await db.delete(schema.subjects);

    console.log("Deleting classes...");
    await db.delete(schema.classes);

    // 3. Remove all non-admin users (test students and teachers)
    console.log("Deleting non-admin users (test students & teachers)...");
    await db.delete(schema.users).where(ne(schema.users.role, "admin"));

    // 4. Update the admin user's password to the production-safe value
    console.log("Updating admin user password...");
    const hashedPassword = await hashPassword("Admin@123");

    const updatedRows = await db
      .update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.role, "admin"));

    console.log(`   ✓ Updated admin password.`);

    console.log("\n✅ Production database cleaned successfully!");
    console.log("   Schema, enums, and constraints: intact");
    console.log("   Admin account:                  admin@mindmastery.edu");
    console.log("   Admin password:                 Admin@123  ← change after first login");
  } catch (error) {
    console.error("❌ Error during production cleanup:", error);
    process.exit(1);
  }
}

main();
