import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Registration from "../models/Registration.js";

// Kết nối DB
await connectDB(process.env.MONGO_URI);

// Đọc file seed mới
const teamsData = JSON.parse(
  fs.readFileSync("./src/seed/additional_teams.seed.json", "utf-8")
);
const tournamentsData = JSON.parse(
  fs.readFileSync("./src/seed/additional_tournaments.seed.json", "utf-8")
);
const registrationsData = JSON.parse(
  fs.readFileSync("./src/seed/additional_registrations.seed.json", "utf-8")
);

console.log("🧩 Seeding additional data...");

for (const t of tournamentsData) {
  // Tạo giải đấu
  const tour = await Tournament.create({
    ...t,
    organizerUser: new mongoose.Types.ObjectId(), // Random organizer ID
  });
  console.log(`🏆 Created Tournament: ${tour.name}`);

  // Tìm team cho game này
  const gameTeams = teamsData.find((g) => g.game === t.game);

  if (gameTeams) {
    for (const team of gameTeams.teams) {
      // Tạo Team
      const teamDoc = await Team.create({
        ...team,
        game: t.game,
        ownerUser: new mongoose.Types.ObjectId(), // Random owner ID
        members: [],
      });
      console.log(`  - Created Team: ${teamDoc.name} (${t.game})`);

      // Tìm đăng ký cho team này trong giải này
      // Lưu ý: registrationsData dùng tournamentIndex tương ứng với index trong additional_tournaments.seed.json
      const currentTournamentIndex = tournamentsData.indexOf(t);
      const reg = registrationsData.find(
        (r) =>
          r.teamName === team.name &&
          r.tournamentIndex === currentTournamentIndex
      );

      if (reg) {
        await Registration.create({
          tournamentId: tour._id,
          teamId: teamDoc._id,
          status: reg.status,
          seed: reg.seed,
        });
        console.log(`    -> Registered: ${reg.status}`);
      }
    }
  }
}

console.log("✅ Done seeding additional data!");
process.exit();
