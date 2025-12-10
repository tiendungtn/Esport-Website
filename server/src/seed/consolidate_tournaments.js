import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Tournament from "../models/Tournament.js";
import Registration from "../models/Registration.js";

await connectDB(process.env.MONGO_URI);

const normalizeGame = (game) => {
  const map = {
    "League of Legends": "Liên Minh Huyền Thoại",
    LoL: "Liên Minh Huyền Thoại",
    "Arena of Valor": "Liên Quân",
    AOV: "Liên Quân",
    "Wild Rift": "Tốc Chiến",
    Valorant: "Valorant",
    VALORANT: "Valorant",
    "CS:GO": "CS2",
    CS2: "CS2",
  };
  return map[game] || game;
};

console.log("🔄 Consolidating tournaments...");

// 1. Lấy tất cả giải đấu
const tournaments = await Tournament.find({});

// 2. Nhóm theo game đã chuẩn hóa
const groups = {};
for (const t of tournaments) {
  const game = normalizeGame(t.game);
  if (!groups[game]) groups[game] = [];
  groups[game].push(t);
}

// 3. Xử lý từng nhóm
for (const [game, tours] of Object.entries(groups)) {
  if (tours.length <= 1) continue;

  console.log(`\nProcessing ${game} (${tours.length} tournaments)...`);

  // Tìm giải đấu "Championship" đích
  let target = tours.find((t) => t.name.includes("Championship"));

  // Nếu không thấy "Championship" hoặc có nhiều, chọn cái có tên "Championship" hoặc cái đầu tiên
  if (!target) {
    console.log(
      `  ⚠️ No 'Championship' found for ${game}, skipping auto-merge.`
    );
    continue;
  }

  console.log(`  ✅ Target: ${target.name} (${target._id})`);

  for (const t of tours) {
    if (t._id.equals(target._id)) continue;

    console.log(`  ➡ Merging from: ${t.name} (${t._id})`);

    // Di chuyển đăng ký
    const result = await Registration.updateMany(
      { tournamentId: t._id },
      { tournamentId: target._id }
    );
    console.log(`     Moved ${result.modifiedCount} registrations.`);

    // Xóa giải đấu cũ
    await Tournament.findByIdAndDelete(t._id);
    console.log(`     Deleted tournament: ${t.name}`);
  }
}

console.log("\n✅ Consolidation complete!");
process.exit();
