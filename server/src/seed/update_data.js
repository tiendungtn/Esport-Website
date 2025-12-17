import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Match from "../models/Match.js";
import Registration from "../models/Registration.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";

async function updateData() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Đã kết nối MongoDB");

    // 1. Cập nhật tất cả giải: maxTeams = 9, thời gian đăng ký từ 15/12 đến 20/12
    const regOpen = new Date("2025-12-15T00:00:00+07:00");
    const regClose = new Date("2025-12-20T23:59:59+07:00");

    const updateResult = await Tournament.updateMany(
      {},
      {
        $set: {
          maxTeams: 9,
          "schedule.regOpen": regOpen,
          "schedule.regClose": regClose,
        },
      }
    );
    console.log(
      `Đã cập nhật ${updateResult.modifiedCount} giải đấu: maxTeams=9, regOpen=15/12, regClose=20/12`
    );

    // 2. Lấy danh sách các game có trong hệ thống
    const allTeams = await Team.find().lean();
    const teamsByGame = {};

    for (const team of allTeams) {
      const game = team.game || "Unknown";
      if (!teamsByGame[game]) {
        teamsByGame[game] = [];
      }
      teamsByGame[game].push(team);
    }

    console.log("\nDanh sách đội theo game:");
    for (const [game, teams] of Object.entries(teamsByGame)) {
      console.log(`  ${game}: ${teams.length} đội`);
    }

    // 3. Giữ lại 9 đội mỗi game, xóa số còn lại
    const teamsToKeep = [];
    const teamsToDelete = [];

    for (const [game, teams] of Object.entries(teamsByGame)) {
      // Sắp xếp theo thời gian tạo (mới nhất trước)
      teams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Giữ 9 đội đầu tiên
      const kept = teams.slice(0, 9);
      const deleted = teams.slice(9);

      teamsToKeep.push(...kept);
      teamsToDelete.push(...deleted);

      console.log(
        `\n${game}: Giữ ${kept.length} đội, xóa ${deleted.length} đội`
      );
    }

    if (teamsToDelete.length > 0) {
      const teamIdsToDelete = teamsToDelete.map((t) => t._id);

      // Xóa các registration liên quan đến đội bị xóa
      const regDeleteResult = await Registration.deleteMany({
        teamId: { $in: teamIdsToDelete },
      });
      console.log(`Đã xóa ${regDeleteResult.deletedCount} đăng ký liên quan`);

      // Xóa các match liên quan đến đội bị xóa
      const matchDeleteResult = await Match.deleteMany({
        $or: [
          { team1: { $in: teamIdsToDelete } },
          { team2: { $in: teamIdsToDelete } },
        ],
      });
      console.log(
        `Đã xóa ${matchDeleteResult.deletedCount} trận đấu liên quan`
      );

      // Xóa các đội
      const teamDeleteResult = await Team.deleteMany({
        _id: { $in: teamIdsToDelete },
      });
      console.log(`Đã xóa ${teamDeleteResult.deletedCount} đội`);
    }

    // 4. Xóa tất cả các registration hiện tại
    await Registration.deleteMany({});
    console.log("\nĐã xóa tất cả đăng ký cũ");

    // 5. Tạo đăng ký mới cho mỗi đội vào giải tương ứng với game của đội
    const tournaments = await Tournament.find().lean();
    const remainingTeams = await Team.find().lean();

    console.log("\nTạo đăng ký mới:");
    let totalRegistrations = 0;

    for (const tournament of tournaments) {
      // Tìm các đội có cùng game với giải
      const matchingTeams = remainingTeams.filter((team) => {
        // Xử lý tên game có thể khác nhau (ví dụ: "League of Legends" vs "Liên Minh Huyền Thoại")
        const tournamentGame = (tournament.game || "").toLowerCase();
        const teamGame = (team.game || "").toLowerCase();

        // Kiểm tra match trực tiếp hoặc alias
        if (tournamentGame === teamGame) return true;

        // Alias cho LOL
        if (
          (tournamentGame.includes("league") ||
            tournamentGame.includes("lol") ||
            tournamentGame.includes("liên minh")) &&
          (teamGame.includes("league") ||
            teamGame.includes("lol") ||
            teamGame.includes("liên minh"))
        ) {
          return true;
        }

        // Alias cho Valorant
        if (
          tournamentGame.includes("valorant") &&
          teamGame.includes("valorant")
        ) {
          return true;
        }

        // Alias cho CS
        if (
          (tournamentGame.includes("counter") ||
            tournamentGame.includes("cs")) &&
          (teamGame.includes("counter") || teamGame.includes("cs"))
        ) {
          return true;
        }

        // Alias cho PUBG
        if (
          (tournamentGame.includes("pubg") ||
            tournamentGame.includes("playerunknown")) &&
          (teamGame.includes("pubg") || teamGame.includes("playerunknown"))
        ) {
          return true;
        }

        return false;
      });

      console.log(`\n${tournament.name} (${tournament.game}):`);
      console.log(`  Tìm thấy ${matchingTeams.length} đội phù hợp`);

      for (const team of matchingTeams) {
        try {
          await Registration.create({
            tournamentId: tournament._id,
            teamId: team._id,
            status: "pending",
          });
          totalRegistrations++;
          console.log(`  + Đăng ký đội "${team.name}"`);
        } catch (err) {
          console.log(`  ! Lỗi đăng ký đội "${team.name}": ${err.message}`);
        }
      }
    }

    console.log(`\n=== HOÀN TẤT ===`);
    console.log(`Tổng số đăng ký mới: ${totalRegistrations}`);

    // Thống kê cuối cùng
    const finalTeamCount = await Team.countDocuments();
    const finalRegCount = await Registration.countDocuments();
    const finalTournamentCount = await Tournament.countDocuments();

    console.log(`\nThống kê:"`);
    console.log(`  - Số giải đấu: ${finalTournamentCount}`);
    console.log(`  - Số đội: ${finalTeamCount}`);
    console.log(`  - Số đăng ký: ${finalRegCount}`);
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nĐã ngắt kết nối MongoDB");
  }
}

updateData();
