import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const rootDir = process.cwd();
if (fs.existsSync(path.resolve(rootDir, ".env.local"))) {
  dotenv.config({ path: path.resolve(rootDir, ".env.local") });
}
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    directory: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
