import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Registration from "../models/Registration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, "full_database_export.json");

async function exportAllData() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("📦 Bắt đầu xuất dữ liệu từ database...\n");

    // Export Users
    console.log("👤 Đang xuất Users...");
    const users = await User.find().lean();
    console.log(`   ✅ Đã tìm thấy ${users.length} users`);

    // Export Teams
    console.log("🏷️  Đang xuất Teams...");
    const teams = await Team.find().lean();
    console.log(`   ✅ Đã tìm thấy ${teams.length} teams`);

    // Export Tournaments
    console.log("🏆 Đang xuất Tournaments...");
    const tournaments = await Tournament.find().lean();
    console.log(`   ✅ Đã tìm thấy ${tournaments.length} tournaments`);

    // Export Matches
    console.log("⚔️  Đang xuất Matches...");
    const matches = await Match.find().lean();
    console.log(`   ✅ Đã tìm thấy ${matches.length} matches`);

    // Export Registrations
    console.log("📝 Đang xuất Registrations...");
    const registrations = await Registration.find().lean();
    console.log(`   ✅ Đã tìm thấy ${registrations.length} registrations`);

    // Create export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportVersion: "1.0",
      data: {
        users,
        teams,
        tournaments,
        matches,
        registrations,
      },
      stats: {
        totalUsers: users.length,
        totalTeams: teams.length,
        totalTournaments: tournaments.length,
        totalMatches: matches.length,
        totalRegistrations: registrations.length,
      },
    };

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportData, null, 2), "utf-8");

    console.log("\n" + "=".repeat(50));
    console.log("📊 THỐNG KÊ XUẤT DỮ LIỆU:");
    console.log("=".repeat(50));
    console.log(`   👤 Users:         ${users.length}`);
    console.log(`   🏷️  Teams:         ${teams.length}`);
    console.log(`   🏆 Tournaments:   ${tournaments.length}`);
    console.log(`   ⚔️  Matches:       ${matches.length}`);
    console.log(`   📝 Registrations: ${registrations.length}`);
    console.log("=".repeat(50));
    console.log(`\n✅ Đã xuất thành công tất cả dữ liệu!`);
    console.log(`📁 File được lưu tại: ${OUTPUT_FILE}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi xuất dữ liệu:", error);
    process.exit(1);
  }
}

exportAllData();
