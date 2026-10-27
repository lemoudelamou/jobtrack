import "dotenv/config";
import { defineConfig } from "prisma/config";

/*
 * The Prisma CLI (migrate, studio, db pull) needs a direct / session
 * connection. On Supabase that is DIRECT_URL (session pooler, port 5432);
 * the app itself connects through DATABASE_URL (transaction pooler, 6543)
 * in lib/prisma.ts. Locally you can leave DIRECT_URL unset.
 */
const url =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("Set DATABASE_URL (and DIRECT_URL on Supabase) in .env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
