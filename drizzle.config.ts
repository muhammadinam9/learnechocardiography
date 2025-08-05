import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set for drizzle config. Using fallback URL for development only.");
  process.env.DATABASE_URL = "postgres://defaultuser:defaultpassword@db.neon.tech/defaultdb?sslmode=require";
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
