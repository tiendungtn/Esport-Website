import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";

async function fixTestData() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Find users to add as members (user10 is already owner, add user11-15)
    const memberEmails = [
      "user11@test.com",
      "user12@test.com",
      "user13@test.com",
      "user14@test.com",
    ];
    const members = await User.find({ email: { $in: memberEmails } });
    console.log(`✅ Found ${members.length} users for team members`);

    // 2. Update Hanoi Legends with more members
    const team = await Team.findOneAndUpdate(
      { name: "Hanoi Legends" },
      { $addToSet: { members: { $each: members.map((m) => m._id) } } },
      { new: true }
    ).populate("members", "email profile.displayName");

    if (!team) {
      console.log("❌ Team 'Hanoi Legends' not found");
      process.exit(1);
    }
    console.log(`✅ Updated team: ${team.name}`);
    console.log(`   Members count: ${team.members.length}`);
    team.members.forEach((m) => console.log(`   - ${m.email}`));

    // 3. Find the ongoing tournament
    const tournament = await Tournament.findOne({
      name: "Test Giải Đang Diễn Ra",
    });
    if (!tournament) {
      console.log("❌ Tournament 'Test Giải Đang Diễn Ra' not found");
      console.log("   Chạy lại: node src/seed/setup_conflict_test.js");
      process.exit(1);
    }
    console.log(
      `\n✅ Found tournament: ${tournament.name} (${tournament._id})`
    );

    // 4. Check if matches exist
    const existingMatches = await Match.countDocuments({
      tournamentId: tournament._id,
    });
    console.log(`   Existing matches: ${existingMatches}`);

    if (existingMatches === 0) {
      console.log("\n⚠️ No matches found! Recreating...");

      // Get other teams for matches
      const otherTeams = await Team.find({
        game: "Liên Minh Huyền Thoại",
        _id: { $ne: team._id },
      }).limit(3);

      const team2 = otherTeams[0] || null;
      const team3 = otherTeams[1] || null;
      const team4 = otherTeams[2] || null;

      // Create matches
      const match1 = await Match.create({
        tournamentId: tournament._id,
        round: 1,
        stage: 1,
        teamA: team._id,
        teamB: team2?._id || null,
        state: "scheduled",
        bestOf: 3,
      });
      console.log(
        `✅ Created Match 1: ${team.name} vs ${team2?.name || "TBD"}`
      );

      const match2 = await Match.create({
        tournamentId: tournament._id,
        round: 1,
        stage: 1,
        teamA: team._id, // Same team for conflict test
        teamB: team3?._id || null,
        state: "scheduled",
        bestOf: 3,
      });
      console.log(
        `✅ Created Match 2: ${team.name} vs ${team3?.name || "TBD"} (CÙNG ĐỘI)`
      );

      const match3 = await Match.create({
        tournamentId: tournament._id,
        round: 1,
        stage: 1,
        teamA: team3?._id || null,
        teamB: team4?._id || null,
        state: "scheduled",
        bestOf: 3,
      });
      console.log(
        `✅ Created Match 3: ${team3?.name || "TBD"} vs ${team4?.name || "TBD"}`
      );
    }

    // 5. Show final count
    const finalMatchCount = await Match.countDocuments({
      tournamentId: tournament._id,
    });
    console.log(`\n✅ DONE! Tournament now has ${finalMatchCount} matches`);
    console.log(`\n📌 Để test:`);
    console.log(`   Đăng nhập: user10@test.com / 123456`);
    console.log(
      `   Admin: /admin → Tab 'Lịch thi đấu' → Chọn 'Test Giải Đang Diễn Ra'`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixTestData();
