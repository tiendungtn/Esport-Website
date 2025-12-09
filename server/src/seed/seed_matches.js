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

    // Xử lý logic chia cặp (giống hệt controller)
    const seeds = seedingByRegistration(regs);
    const pairs = generateSERoundPairs(seeds);

    console.log(
      `   ✅ Số đội: ${regs.length} -> Sinh ra ${pairs.length} cặp đấu vòng 1.`
    );

    const matchesToInsert = [];

    // Tạo các trận đấu vòng 1
    for (const [teamAId, teamBId] of pairs) {
      matchesToInsert.push({
        tournamentId: tour._id,
        round: 1, // Vòng 1
        teamA: teamAId, // Có thể null nếu là đội Bye (nhưng logic padding đã handle)
        teamB: teamBId,
        scoreA: 0,
        scoreB: 0,
        state: "scheduled", // Trạng thái chưa đá
        bestOf: 1,
      });
    }

    if (matchesToInsert.length > 0) {
      await Match.insertMany(matchesToInsert);
      console.log(
        `   🎉 Đã tạo thành công ${matchesToInsert.length} trận đấu vào DB.`
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
