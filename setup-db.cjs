const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.resolve("./saptara.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("Creating tables...");

db.exec(`
  CREATE TABLE IF NOT EXISTS "user" (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, email_verified INTEGER NOT NULL DEFAULT 0, image TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "session" (id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, ip_address TEXT, user_agent TEXT, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "account" (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, provider_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE, access_token TEXT, refresh_token TEXT, id_token TEXT, access_token_expires_at INTEGER, refresh_token_expires_at INTEGER, scope TEXT, password TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "verification" (id TEXT PRIMARY KEY, identifier TEXT NOT NULL, value TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "teacher" (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE, display_name TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "class" (id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER NOT NULL REFERENCES "teacher"(id) ON DELETE CASCADE, school_name TEXT NOT NULL, class_code TEXT NOT NULL, ship_name TEXT NOT NULL, created_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE(class_code, school_name));
  CREATE TABLE IF NOT EXISTS "student" (id INTEGER PRIMARY KEY AUTOINCREMENT, class_id INTEGER NOT NULL REFERENCES "class"(id) ON DELETE CASCADE, name TEXT NOT NULL, avatar TEXT NOT NULL DEFAULT '🧒', xp INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, last_active_date TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE(name, class_id));
  CREATE TABLE IF NOT EXISTS "habit" (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT NOT NULL, island TEXT NOT NULL, badge TEXT NOT NULL, badge_icon TEXT NOT NULL, color TEXT NOT NULL, description TEXT NOT NULL, position_x INTEGER NOT NULL, position_y INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS "habit_completion" (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE, habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE, date TEXT NOT NULL, completed_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE(student_id, habit_id, date));
  CREATE TABLE IF NOT EXISTS "logbook_entry" (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE, habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE, date TEXT NOT NULL, time TEXT NOT NULL, photo_url TEXT, caption TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', reviewed_by_teacher_id INTEGER REFERENCES "teacher"(id), teacher_comment TEXT, teacher_sticker TEXT, xp_earned INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()), updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
  CREATE TABLE IF NOT EXISTS "student_badge" (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE, habit_id INTEGER NOT NULL REFERENCES "habit"(id) ON DELETE CASCADE, awarded_by_teacher_id INTEGER REFERENCES "teacher"(id), awarded_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE(student_id, habit_id));
  CREATE TABLE IF NOT EXISTS "student_accessory" (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE, accessory_id TEXT NOT NULL, purchased_at INTEGER NOT NULL DEFAULT (unixepoch()), UNIQUE(student_id, accessory_id));
  CREATE TABLE IF NOT EXISTS "weekly_snapshot" (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES "student"(id) ON DELETE CASCADE, week_start_date TEXT NOT NULL, day_of_week INTEGER NOT NULL, completed_count INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()));
`);

console.log("Tables created!");

const count = db.prepare("SELECT COUNT(*) as c FROM habit").get();
if (count.c === 0) {
  const ins = db.prepare("INSERT INTO habit (name,icon,island,badge,badge_icon,color,description,position_x,position_y) VALUES (?,?,?,?,?,?,?,?,?)");
  const tx = db.transaction((rows) => { for (const r of rows) ins.run(...r); });
  tx([
    ["Bangun Pagi","🌅","Pulau Fajar","Lencana Fajar","🌄","#FFB703","Bangun pagi sebelum matahari terbit",50,13],
    ["Beribadah","🕌","Pulau Ibadah","Lencana Ibadah","🌙","#8338EC","Beribadah tepat waktu",78,30],
    ["Berolahraga","🏃","Pulau Perkasa","Lencana Perkasa","💪","#E76F51","Berolahraga minimal 30 menit",80,52],
    ["Makan Sehat dan Bergizi","🥗","Pulau Rendang","Lencana Rendang","🍛","#06D6A0","Makan makanan bergizi",72,75],
    ["Belajar Mandiri","📚","Pulau Cerdas","Lencana Cerdas","🎓","#118AB2","Membaca buku secara mandiri",45,88],
    ["Bermasyarakat","🤝","Pulau Gotong Royong","Lencana Gotong Royong","👐","#EF476F","Membantu dan berbuat baik",20,68],
    ["Tidur Cepat","😴","Pulau Mimpi","Lencana Mimpi","⭐","#6C63FF","Tidur sebelum jam 9 malam",22,35]
  ]);
  console.log("Seeded 7 habits!");
} else {
  console.log("Habits already exist (" + count.c + ")");
}

db.close();
console.log("Done!");
