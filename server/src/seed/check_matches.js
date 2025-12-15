import "dotenv/config";
import { connectDB } from "../config/db.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";

async function checkMatches() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const tournament = await Tournament.findOne({
      name: "Test Giải Đang Diễn Ra",
    });
    if (!tournament) {
      console.log("❌ Tournament not found");
      process.exit(1);
    }

    console.log(`\nTournament: ${tournament.name} (${tournament._id})`);

    const matches = await Match.find({ tournamentId: tournament._id })
      .populate("teamA", "name")
      .populate("teamB", "name");

    console.log(`\nFound ${matches.length} matches:\n`);

    matches.forEach((m, i) => {
      console.log(`Match ${i + 1}: ${m._id}`);
      console.log(
        `  teamA: ${m.teamA?.name || "NULL"} (${m.teamA?._id || "NULL"})`
      );
      console.log(
        `  teamB: ${m.teamB?.name || "NULL"} (${m.teamB?._id || "NULL"})`
      );
      console.log(`  scheduledAt: ${m.scheduledAt || "NOT SET"}`);
      console.log(`  round: ${m.round}`);
      console.log("");
    });

    // Check for common teams
    console.log("=== Checking Team Overlap ===");
    const allTeamIds = [];
    matches.forEach((m) => {
      if (m.teamA) allTeamIds.push(m.teamA._id.toString());
      if (m.teamB) allTeamIds.push(m.teamB._id.toString());
    });

    const duplicates = allTeamIds.filter(
      (id, i) => allTeamIds.indexOf(id) !== i
    );
    if (duplicates.length > 0) {
      console.log(
        `✅ Found teams appearing in multiple matches: ${duplicates.length}`
      );
      console.log(`   Team IDs: ${[...new Set(duplicates)].join(", ")}`);
    } else {
      console.log(
        "⚠️ No team appears in multiple matches - conflict detection won't work!"
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkMatches();
