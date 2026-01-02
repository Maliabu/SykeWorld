import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Support both .env and .env.local files
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "./lib/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});




