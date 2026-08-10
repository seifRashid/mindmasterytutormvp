import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { INITIAL_CLASSES, INITIAL_USERS } from "../lib/mock-data";
import { toUuid } from "../lib/id-mapper";
import { hashPassword } from "../lib/crypto";

// Load environment variables
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("DATABASE_URL is not set in environment variables!");
  process.exit(1);
}

const sql = neon(connectionString);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding database...");

  try {
    // 1. Clean existing records (Optional but useful for clean seed)
    console.log("Cleaning existing users and classes...");
    await db.delete(schema.users);
    await db.delete(schema.classes);

    // 2. Seed Classes
    console.log("Seeding classes...");
    for (const c of INITIAL_CLASSES) {
      await db.insert(schema.classes).values({
        id: toUuid(c.id),
        name: c.name,
        slug: c.slug,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_CLASSES.length} classes.`);

    // 3. Seed Users (with hashed passwords)
    console.log("Seeding users...");
    for (const u of INITIAL_USERS) {
      const plainPassword = u.password || "password123";
      const hashedPassword = await hashPassword(plainPassword);

      await db.insert(schema.users).values({
        id: toUuid(u.id),
        name: u.name,
        email: u.email.toLowerCase(),
        password: hashedPassword,
        role: u.role,
        status: u.status || "approved",
        phone: u.phone || null,
        age: u.age || null,
        gender: u.gender || null,
        classId: u.classId ? toUuid(u.classId) : null,
        parentName: u.parentName || null,
        parentPhone: u.parentPhone || null,
        parentEmail: u.parentEmail || null,
        notes: u.notes || null,
        rejectionReason: u.rejectionReason || null,
        image: u.image || null,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`Seeded ${INITIAL_USERS.length} users.`);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
