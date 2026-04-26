import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.js";
import path from "path";

const dbPath = process.env.DATABASE_PATH || "./saptara.db";

const sqlite = new Database(path.resolve(dbPath));

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
// Enable foreign keys (disabled by default in SQLite)
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
