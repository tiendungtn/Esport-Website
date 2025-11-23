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

// 1. Get all tournaments
const tournaments = await Tournament.find({});

// 2. Group by normalized game
const groups = {};
for (const t of tournaments) {
  const game = normalizeGame(t.game);
  if (!groups[game]) groups[game] = [];
  groups[game].push(t);
}

// 3. Process each group
for (const [game, tours] of Object.entries(groups)) {
  if (tours.length <= 1) continue;

  console.log(`\nProcessing ${game} (${tours.length} tournaments)...`);

  // Find the target "Championship" tournament
  let target = tours.find((t) => t.name.includes("Championship"));

  // If no "Championship" found, or multiple, just pick the one with "Championship" or the first one
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

    // Move registrations
    const result = await Registration.updateMany(
      { tournamentId: t._id },
      { tournamentId: target._id }
    );
    console.log(`     Moved ${result.modifiedCount} registrations.`);

    // Delete the old tournament
    await Tournament.findByIdAndDelete(t._id);
    console.log(`     Deleted tournament: ${t.name}`);
  }
}

console.log("\n✅ Consolidation complete!");
process.exit();
