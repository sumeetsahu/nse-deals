import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import * as schema from "./schema";

let singleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

function resolveSqlitePath(url: string): string {
  if (url.startsWith("file:")) {
    return url.slice("file:".length);
  }
  return url;
}

export function getDb() {
  if (singleton) return singleton;
  const url = process.env.DATABASE_URL ?? "file:./data/app.sqlite";
  if (url.startsWith("postgres")) {
    throw new Error(
      "This build uses SQLite only. Set DATABASE_URL=file:./data/app.sqlite (default).",
    );
  }
  let rel = resolveSqlitePath(url);
  if (rel.startsWith("./")) rel = rel.slice(2);
  const filePath = path.isAbsolute(rel)
    ? rel
    : path.join(/* turbopackIgnore: true */ process.cwd(), rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const sqlite = new Database(filePath);
  sqlite.pragma("journal_mode = WAL");
  singleton = drizzle(sqlite, { schema });
  return singleton;
}

export type AppDb = ReturnType<typeof getDb>;
