import "dotenv/config";
import { db } from "./index.js";
import { habit } from "./schema.js";

// ── Seed the 7 Habits (Pulau Misi) ──
async function seedHabits() {
  await db
    .insert(habit)
    .values([
      {
        name: "Bangun Pagi",
        icon: "🌅",
        island: "Pulau Fajar",
        badge: "Lencana Fajar",
        badgeIcon: "🌄",
        color: "#FFB703",
        description:
          "Bangun pagi sebelum matahari terbit dan rapikan tempat tidur",
        positionX: 50,
        positionY: 13,
      },
      {
        name: "Beribadah",
        icon: "🕌",
        island: "Pulau Ibadah",
        badge: "Lencana Ibadah",
        badgeIcon: "🌙",
        color: "#8338EC",
        description:
          "Beribadah tepat waktu dan berdoa sebelum & sesudah beraktivitas",
        positionX: 78,
        positionY: 30,
      },
      {
        name: "Berolahraga",
        icon: "🏃",
        island: "Pulau Perkasa",
        badge: "Lencana Perkasa",
        badgeIcon: "💪",
        color: "#E76F51",
        description: "Berolahraga atau bermain aktif minimal 30 menit sehari",
        positionX: 80,
        positionY: 52,
      },
      {
        name: "Makan Sehat dan Bergizi",
        icon: "🥗",
        island: "Pulau Rendang",
        badge: "Lencana Rendang",
        badgeIcon: "🍛",
        color: "#06D6A0",
        description:
          "Makan makanan bergizi: sayur, buah, lauk pauk, dan minum air putih",
        positionX: 72,
        positionY: 75,
      },
      {
        name: "Belajar Mandiri",
        icon: "📚",
        island: "Pulau Cerdas",
        badge: "Lencana Cerdas",
        badgeIcon: "🎓",
        color: "#118AB2",
        description:
          "Membaca buku atau mengerjakan tugas secara mandiri tanpa disuruh",
        positionX: 45,
        positionY: 88,
      },
      {
        name: "Bermasyarakat",
        icon: "🤝",
        island: "Pulau Gotong Royong",
        badge: "Lencana Gotong Royong",
        badgeIcon: "👐",
        color: "#EF476F",
        description:
          "Membantu orang tua, bergotong royong, dan berbuat baik kepada sesama",
        positionX: 20,
        positionY: 68,
      },
      {
        name: "Tidur Cepat",
        icon: "😴",
        island: "Pulau Mimpi",
        badge: "Lencana Mimpi",
        badgeIcon: "⭐",
        color: "#6C63FF",
        description:
          "Tidur cepat sebelum jam 9 malam agar bangun segar esok hari",
        positionX: 22,
        positionY: 35,
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Seeded 7 habits (Pulau Misi)");
}

// ── Run seed ──
async function main() {
  console.log("🌱 Seeding database...");
  await seedHabits();
  console.log("✅ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
