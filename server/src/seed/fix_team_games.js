import "dotenv/config";
import fs from "fs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Team from "../models/Team.js";

await connectDB(process.env.MONGO_URI);

const teamsData = JSON.parse(
  fs.readFileSync("./src/seed/teams.seed.json", "utf-8")
);

console.log("🧩 Fixing team games...");

for (const gameGroup of teamsData) {
  const gameName = gameGroup.game;
  console.log(`Processing game: ${gameName}`);

  for (const team of gameGroup.teams) {
    const updatedTeam = await Team.findOneAndUpdate(
      { name: team.name },
      { game: gameName },
      { new: true }
    );

    if (updatedTeam) {
      console.log(`✅ Updated ${team.name} -> ${gameName}`);
    } else {
      console.log(`⚠️ Team not found: ${team.name}`);
    }
  }
}

console.log("✅ Done fixing team games!");
process.exit();
