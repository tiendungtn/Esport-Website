import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Tournament from "../models/Tournament.js";
import Registration from "../models/Registration.js";
import Match from "../models/Match.js";
import {
  seedingByRegistration,
  generateSERoundPairs,
} from "../utils/bracket.js";

// Kết nối DB
await connectDB(process.env.MONGO_URI);

console.log("🔥 Bắt đầu sinh Bracket và Trận đấu cho các giải đấu...");

try {
  // 1. Xóa hết các trận đấu cũ để tránh trùng lặp
  await Match.deleteMany({});
  console.log("🧹 Đã xóa sạch dữ liệu Match cũ.");

  // 2. Lấy danh sách giải đấu
  const tournaments = await Tournament.find({});

  for (const tour of tournaments) {
    console.log(`\n🏆 Đang xử lý giải: ${tour.name} (${tour.game})`);

    // Lấy danh sách đăng ký đã duyệt hoặc pending (để test thì lấy cả pending cho nhiều đội)
    const regs = await Registration.find({
      tournamentId: tour._id,
      // status: "approved" // Nếu muốn chặt chẽ thì bỏ comment dòng này
    }).lean();

    if (regs.length < 2) {
      console.log(`   ⚠️ Không đủ đội đăng ký (${regs.length} đội). Bỏ qua.`);
      continue;
    }

    // Sử dụng thuật toán tạo bracket đầy đủ mới
    const { generateFullSEBracket } = await import("../utils/bracket.js");
    const seeds = seedingByRegistration(regs);
    const matchesData = generateFullSEBracket(seeds, tour._id);

    // Gán ID trước để liên kết
    const mongoose = await import("mongoose");
    matchesData.forEach((m) => {
      // Dùng _id có sẵn nếu có hoặc tạo mới
      // script seed tạo object thuần
      m._id = new mongoose.default.Types.ObjectId();
    });

    // Liên kết ID
    matchesData.forEach((m) => {
      if (m.nextMatchRef) {
        if (m.nextMatchSlot === "A") {
          m.nextMatchIdA = m.nextMatchRef._id;
        } else {
          m.nextMatchIdB = m.nextMatchRef._id;
        }
        delete m.nextMatchRef;
        delete m.nextMatchSlot;
      }
      delete m.matchIndex;
    });

    if (matchesData.length > 0) {
      await Match.insertMany(matchesData);
      console.log(
        `   🎉 Đã tạo thành công ${matchesData.length} trận đấu vào DB.`
      );

      // Cập nhật trạng thái giải đấu sang "ongoing" để hiện thị đúng trên UI
      tour.status = "ongoing";
      await tour.save();
    }
  }

  console.log(
    "\n🏁 Hoàn tất! Bây giờ Ngài có thể vào trang Bracket và Admin Match để kiểm tra."
  );
} catch (error) {
  console.error("❌ Lỗi khi seed matches:", error);
} finally {
  process.exit();
}
