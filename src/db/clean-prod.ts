import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { ne, eq } from "drizzle-orm";

import * as schema from "./schema";
import { hashPassword } from "../lib/crypto";
import { INITIAL_CLASSES } from "../lib/mock-data";
import { toUuid } from "../lib/id-mapper";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD;
const resetConfirmation = process.env.ALLOW_PROD_RESET;

if (!connectionString) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

if (!adminPassword) {
  console.error("ADMIN_PASSWORD is not configured.");
  process.exit(1);
}

if (adminPassword.length < 12) {
  console.error("ADMIN_PASSWORD must contain at least 12 characters.");
  process.exit(1);
}

if (!/[A-Z]/.test(adminPassword)) {
  console.error("ADMIN_PASSWORD must contain at least one uppercase letter.");
  process.exit(1);
}

if (!/[a-z]/.test(adminPassword)) {
  console.error("ADMIN_PASSWORD must contain at least one lowercase letter.");
  process.exit(1);
}

if (!/[0-9]/.test(adminPassword)) {
  console.error("ADMIN_PASSWORD must contain at least one number.");
  process.exit(1);
}

if (!/[^A-Za-z0-9]/.test(adminPassword)) {
  console.error("ADMIN_PASSWORD must contain at least one special character.");
  process.exit(1);
}

const validatedAdminPassword = adminPassword;

/*
 * This script performs destructive operations on the database.
 * An explicit confirmation is required before it can run.
 */
if (resetConfirmation !== "I_UNDERSTAND_THIS_WILL_DELETE_DATA") {
  console.error("Production database reset blocked.");
  console.error(
    "Set ALLOW_PROD_RESET to the required confirmation value if this operation is intentional."
  );
  process.exit(1);
}

const sql = neon(connectionString);

const db = drizzle(sql, {
  schema,
});

async function main() {
  console.log("Starting production database cleanup...");
  console.log("Preserving admin users.");
  console.log("Removing test data and non-admin users.");

  try {
    // Delete user progress and attempt records.
    console.log("Deleting quiz attempts...");
    await db.delete(schema.quizAttempts);

    console.log("Deleting lesson progress...");
    await db.delete(schema.lessonProgress);

    // Delete quiz content in dependency order.
    console.log("Deleting answers...");
    await db.delete(schema.answers);

    console.log("Deleting questions...");
    await db.delete(schema.questions);

    console.log("Deleting quizzes...");
    await db.delete(schema.quizzes);

    // Delete lesson content.
    console.log("Deleting lesson attachments...");
    await db.delete(schema.lessonAttachments);

    console.log("Deleting lessons...");
    await db.delete(schema.lessons);

    // Delete course structure.
    console.log("Deleting topics...");
    await db.delete(schema.topics);

    console.log("Deleting subjects...");
    await db.delete(schema.subjects);

    console.log("Deleting classes...");
    await db.delete(schema.classes);

    // Restore system reference classes.
    console.log("Re-seeding system reference classes...");

    for (const c of INITIAL_CLASSES) {
      await db.insert(schema.classes).values({
        id: toUuid(c.id),
        name: c.name,
        slug: c.slug,
        createdAt: new Date(),
      });
    }

    console.log(
      `Re-seeded ${INITIAL_CLASSES.length} reference classes.`
    );

    // Remove all non-admin users.
    console.log("Deleting non-admin users...");

    await db
      .delete(schema.users)
      .where(ne(schema.users.role, "admin"));

    // Hash and update the admin password.
    console.log("Updating admin password...");

    const hashedPassword = await hashPassword(validatedAdminPassword);

    await db
      .update(schema.users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.role, "admin"));

    console.log("Admin password updated.");
    console.log("Production database cleanup completed.");
  } catch (error) {
    console.error("Production database cleanup failed.");

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    process.exit(1);
  });
