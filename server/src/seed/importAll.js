import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Registration from "../models/Registration.js";

await connectDB(process.env.MONGO_URI);

const teams = JSON.parse(
  fs.readFileSync("./src/seed/teams.seed.json", "utf-8")
);
const tournaments = JSON.parse(
  fs.readFileSync("./src/seed/tournaments.seed.json", "utf-8")
);
const registrations = JSON.parse(
  fs.readFileSync("./src/seed/registrations.seed.json", "utf-8")
);

console.log("🧩 Seeding data...");
for (const t of tournaments) {
  const tour = await Tournament.create({
    ...t,
    organizerUser: new mongoose.Types.ObjectId(),
  });
  console.log(`🏆 Created ${tour.name}`);
  const game = teams.find((g) => g.game === t.game);
  for (const team of game.teams) {
    const teamDoc = await Team.create({
      ...team,
      ownerUser: new mongoose.Types.ObjectId(),
      members: [],
    });
    const reg = registrations.find(
      (r) =>
        r.teamName === team.name && r.tournamentIndex === tournaments.indexOf(t)
    );
    if (reg) {
      await Registration.create({
        tournamentId: tour._id,
        teamId: teamDoc._id,
        status: reg.status,
        seed: reg.seed,
      });
    }
  }
}
console.log("✅ Done seeding!");
process.exit();
