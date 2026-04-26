import Database from "better-sqlite3";
import path from "path";
import "dotenv/config";

const dbPath = process.env.DATABASE_PATH || "./saptara.db";
const db = new Database(path.resolve(dbPath));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("🗂️  Creating tables in", path.resolve(dbPath), "...\n");

// Create all tables
db.exec(`
  -- Better Auth tables
  CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS "session" (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS "account" (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS "verification" (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );

  -- Application tables
  CREATE TABLE IF NOT EXISTS "teacher" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS "class" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL REFERENCES "teacher"(id) ON DELETE CASCADE,
    school_name TEXT NOT NULL,
    class_code TEXT NOT NULL,
    ship_name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(class_code, school_name)
  );
  CREATE INDEX IF NOT EXISTS class_teacher_idx ON "class"(teacher_id);

  CREATE TABLE IF NOT EXISTS "student" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL REFERENCES "class"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🧒',
    xp INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(name, class_id)
  );
  CREATE INDEX IF NOT EXISTS student_class_idx ON "student"(class_id);

  CREATE TABLE IF NOT EXISTS "habit" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    island TEXT NOT NULL,
    badge TEXT NOT NULL,
    badge_icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "habit_completion" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE,
    habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    completed_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(student_id, habit_id, date)
  );
  CREATE INDEX IF NOT EXISTS habit_completion_student_date_idx ON "habit_completion"(student_id, date);

  CREATE TABLE IF NOT EXISTS "logbook_entry" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE,
    habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    photo_url TEXT,
    caption TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by_teacher_id INTEGER REFERENCES "teacher"(id),
    teacher_comment TEXT,
    teacher_sticker TEXT,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS logbook_student_idx ON "logbook_entry"(student_id);
  CREATE INDEX IF NOT EXISTS logbook_status_idx ON "logbook_entry"(status);
  CREATE INDEX IF NOT EXISTS logbook_date_idx ON "logbook_entry"(date);

  CREATE TABLE IF NOT EXISTS "student_badge" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE,
    habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE,
    awarded_by_teacher_id INTEGER REFERENCES "teacher"(id),
    awarded_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(student_id, habit_id)
  );

  CREATE TABLE IF NOT EXISTS "student_accessory" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE,
    accessory_id TEXT NOT NULL,
    purchased_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(student_id, accessory_id)
  );

  CREATE TABLE IF NOT EXISTS "weekly_snapshot" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE,
    week_start_date TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    completed_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS weekly_student_week_idx ON "weekly_snapshot"(student_id, week_start_date);
`);

console.log("✅ All tables created!\n");

// Seed habits
const existingHabits = db.prepare("SELECT COUNT(*) as count FROM habit").get() as { count: number };
if (existingHabits.count === 0) {
  const insertHabit = db.prepare(`
    INSERT INTO habit (name, icon, island, badge, badge_icon, color, description, position_x, position_y)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const habits = [
    ["Bangun Pagi", "🌅", "Pulau Fajar", "Lencana Fajar", "🌄", "#FFB703", "Bangun pagi sebelum matahari terbit dan rapikan tempat tidur", 50, 13],
    ["Beribadah", "🕌", "Pulau Ibadah", "Lencana Ibadah", "🌙", "#8338EC", "Beribadah tepat waktu dan berdoa sebelum & sesudah beraktivitas", 78, 30],
    ["Berolahraga", "🏃", "Pulau Perkasa", "Lencana Perkasa", "💪", "#E76F51", "Berolahraga atau bermain aktif minimal 30 menit sehari", 80, 52],
    ["Makan Sehat dan Bergizi", "🥗", "Pulau Rendang", "Lencana Rendang", "🍛", "#06D6A0", "Makan makanan bergizi: sayur, buah, lauk pauk, dan minum air putih", 72, 75],
    ["Belajar Mandiri", "📚", "Pulau Cerdas", "Lencana Cerdas", "🎓", "#118AB2", "Membaca buku atau mengerjakan tugas secara mandiri tanpa disuruh", 45, 88],
    ["Bermasyarakat", "🤝", "Pulau Gotong Royong", "Lencana Gotong Royong", "👐", "#EF476F", "Membantu orang tua, bergotong royong, dan berbuat baik kepada sesama", 20, 68],
    ["Tidur Cepat", "😴", "Pulau Mimpi", "Lencana Mimpi", "⭐", "#6C63FF", "Tidur cepat sebelum jam 9 malam agar bangun segar esok hari", 22, 35],
  ];

  const insertMany = db.transaction((rows: any[]) => {
    for (const row of rows) {
      insertHabit.run(...row);
    }
  });
  insertMany(habits);
  console.log("🌱 Seeded 7 habits (Pulau Misi)");
} else {
  console.log("ℹ️  Habits already seeded, skipping");
}

db.close();
console.log("\n✅ Database setup complete!");
