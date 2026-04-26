import "dotenv/config";
import { createApp } from "./app.js";
import fs from "fs";
import path from "path";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`📁 Created uploads directory: ${path.resolve(uploadDir)}`);
}

const app = createApp();

app.listen(PORT, () => {
  console.log("");
  console.log("  ⛵ ═══════════════════════════════════════");
  console.log("  ⛵  SAPTARA — Sapta Karakter Anak Nusantara");
  console.log("  ⛵  Ekspedisi Tujuh Samudra — Backend API");
  console.log("  ⛵ ═══════════════════════════════════════");
  console.log("");
  console.log(`  🚀 Server running at http://localhost:${PORT}`);
  console.log(`  📋 Health check:     http://localhost:${PORT}/api/health`);
  console.log(`  🔐 Auth (Better):    http://localhost:${PORT}/api/auth`);
  console.log(`  🏫 Classes API:      http://localhost:${PORT}/api/classes`);
  console.log(`  🧒 Students API:     http://localhost:${PORT}/api/students`);
  console.log(`  📋 Habits API:       http://localhost:${PORT}/api/habits`);
  console.log(`  📸 Logbook API:      http://localhost:${PORT}/api/logbook`);
  console.log(`  🏅 Rewards API:      http://localhost:${PORT}/api/rewards`);
  console.log("");
});
