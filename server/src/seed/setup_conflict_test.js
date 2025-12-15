/**
 * Tạo dữ liệu test cho Schedule Conflict Detection
 *
 * Kịch bản:
 * 1. Tournament "Test Giải Đang Diễn Ra" - status: ongoing, có bracket
 *    - Team có owner đã đăng ký và approved
 * 2. Tournament "Test Giải Mới Overlap" - status: open
 *    - Thử đăng ký cùng team vào đây -> nên bị từ chối (conflict)
 *
 * Chạy: node src/seed/setup_conflict_test.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Registration from "../models/Registration.js";
import Match from "../models/Match.js";
import User from "../models/User.js";

async function setupConflictTest() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Tìm team bất kỳ có owner
    let testTeam = await Team.findOne({
      ownerUser: { $exists: true, $ne: null },
    }).populate("ownerUser", "email displayName");

    if (!testTeam) {
      console.log("❌ Không tìm thấy team nào có owner.");
      console.log("   Đang tạo team test mới...");

      // Tìm user để làm owner
      let owner = await User.findOne({ role: "player" });
      if (!owner) {
        owner = await User.findOne({});
      }

      if (!owner) {
        console.log(
          "❌ Không có user nào trong DB. Chạy seed users trước: node src/seed/seed_users.js"
        );
        process.exit(1);
      }

      // Tạo team test
      testTeam = await Team.create({
        name: "Test Conflict Team",
        tag: "TCT",
        game: "Liên Minh Huyền Thoại",
        ownerUser: owner._id,
        members: [owner._id],
      });

      // Re-populate
      testTeam = await Team.findById(testTeam._id).populate(
        "ownerUser",
        "email displayName"
      );
    }

    const teamGame = testTeam.game || "Liên Minh Huyền Thoại";

    console.log(`\n✅ Sử dụng team: ${testTeam.name} (${testTeam._id})`);
    console.log(
      `   Owner: ${
        testTeam.ownerUser?.email || testTeam.ownerUser?.displayName || "N/A"
      }`
    );
    console.log(`   Game: ${teamGame}`);

    // 2. Xóa các tournament test cũ (nếu có)
    await Tournament.deleteMany({
      name: { $in: ["Test Giải Đang Diễn Ra", "Test Giải Mới Overlap"] },
    });
    console.log("\n🗑️ Đã xóa tournament test cũ");

    // 3. Tạo Tournament đang ongoing (có schedule)
    const now = new Date();
    const startAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 ngày trước
    const endAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày sau

    const ongoingTournament = await Tournament.create({
      name: "Test Giải Đang Diễn Ra",
      game: teamGame,
      format: "SE",
      maxTeams: 8,
      status: "ongoing",
      schedule: {
        regOpen: new Date(startAt.getTime() - 14 * 24 * 60 * 60 * 1000),
        regClose: startAt,
        startAt: startAt,
        endAt: endAt,
      },
      description: "Giải đấu test để kiểm tra conflict (ONGOING)",
    });
    console.log(`✅ Tạo tournament ONGOING: ${ongoingTournament.name}`);

    // 4. Tạo Registration approved cho team vào giải ongoing
    await Registration.deleteMany({
      teamId: testTeam._id,
      tournamentId: ongoingTournament._id,
    });

    await Registration.create({
      tournamentId: ongoingTournament._id,
      teamId: testTeam._id,
      status: "approved",
      seed: 1,
    });
    console.log(`✅ Đăng ký ${testTeam.name} vào giải ONGOING (approved)`);

    // 5. Tạo Tournament mới overlap thời gian
    const newTournament = await Tournament.create({
      name: "Test Giải Mới Overlap",
      game: teamGame,
      format: "SE",
      maxTeams: 8,
      status: "open",
      schedule: {
        regOpen: now,
        regClose: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        startAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // overlap với ongoing
        endAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      },
      description: "Giải đấu test OPEN để thử đăng ký conflict",
    });
    console.log(`✅ Tạo tournament OPEN: ${newTournament.name}`);

    // 6. Tạo Matches cho tournament ongoing (để test match scheduling)
    await Match.deleteMany({ tournamentId: ongoingTournament._id });

    // Lấy thêm teams cùng game để tạo bracket
    const otherTeams = await Team.find({
      game: teamGame,
      _id: { $ne: testTeam._id },
    }).limit(3);

    const team2 = otherTeams[0] || null;
    const team3 = otherTeams[1] || null;
    const team4 = otherTeams[2] || null;

    // Để test match schedule conflict, tạo 2 trận có cùng team
    // Match 1: testTeam vs team2
    // Match 2: testTeam vs team3 (cùng team để có thể test conflict)
    const match1 = await Match.create({
      tournamentId: ongoingTournament._id,
      round: 1,
      stage: 1,
      teamA: testTeam._id,
      teamB: team2?._id || null,
      state: "scheduled",
      bestOf: 3,
    });
    console.log(`✅ Tạo Match 1: ${testTeam.name} vs ${team2?.name || "TBD"}`);

    const match2 = await Match.create({
      tournamentId: ongoingTournament._id,
      round: 1,
      stage: 1,
      teamA: testTeam._id, // Cùng team để test conflict
      teamB: team3?._id || null,
      state: "scheduled",
      bestOf: 3,
    });
    console.log(
      `✅ Tạo Match 2: ${testTeam.name} vs ${
        team3?.name || "TBD"
      } (CÙNG ĐỘI ĐỂ TEST CONFLICT)`
    );

    // Tạo Match 3 cho teams khác
    const match3 = await Match.create({
      tournamentId: ongoingTournament._id,
      round: 1,
      stage: 1,
      teamA: team3?._id || null,
      teamB: team4?._id || null,
      state: "scheduled",
      bestOf: 3,
    });
    console.log(
      `✅ Tạo Match 3: ${team3?.name || "TBD"} vs ${team4?.name || "TBD"}`
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎮 TEST DATA SẴN SÀNG!");
    console.log("=".repeat(60));
    console.log("\n📋 HƯỚNG DẪN TEST:\n");

    console.log("🔹 TEST 1: Registration Conflict Detection");
    console.log(
      `   1. Đăng nhập bằng: ${testTeam.ownerUser?.email || "owner của team"}`
    );
    console.log(`   2. Vào trang giải: "Test Giải Mới Overlap"`);
    console.log(`   3. Thử đăng ký team "${testTeam.name}" → NÊN BỊ TỪ CHỐI`);
    console.log(
      `      (Vì đội đang tham gia 'Test Giải Đang Diễn Ra' - ongoing)\n`
    );

    console.log("🔹 TEST 2: Admin Match Scheduling");
    console.log("   1. Đăng nhập admin → /admin → Tab 'Lịch thi đấu'");
    console.log(`   2. Chọn giải "Test Giải Đang Diễn Ra"`);
    console.log(
      "   3. Click 📅 trên Match 1 → Chọn thời gian → 'Đặt lịch' → THÀNH CÔNG"
    );
    console.log(
      "   4. Click 📅 trên Match 2 → Chọn CÙNG thời gian ±2 giờ → NÊN BÁO XUNG ĐỘT"
    );
    console.log(
      `      (Vì Match 1 và Match 2 đều có team "${testTeam.name}")\n`
    );

    console.log("📌 IDs:");
    console.log(`   - Tournament ONGOING: ${ongoingTournament._id}`);
    console.log(`   - Tournament OPEN:    ${newTournament._id}`);
    console.log(`   - Team test:          ${testTeam._id}`);
    console.log(`   - Match 1:            ${match1._id}`);
    console.log(`   - Match 2:            ${match2._id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setupConflictTest();
