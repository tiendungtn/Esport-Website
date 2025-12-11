import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Registration from "../models/Registration.js";
import Match from "../models/Match.js";
import Tournament from "../models/Tournament.js";

const resetData = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("🔥 Connected to DB. Starting reset...");

    // 1. Reset Registrations to 'pending'
    const regResult = await Registration.updateMany({}, { status: "pending" });
    console.log(
      `✅ Reset ${regResult.modifiedCount} registrations to 'pending'.`
    );

    // 2. Delete all Matches
    const matchResult = await Match.deleteMany({});
    console.log(`✅ Deleted ${matchResult.deletedCount} matches.`);

    // 3. Reset Tournaments (ongoing/finished -> open)
    // We keep 'draft' as is, but assuming we want to test approval, we likely want 'open'.
    // However, strictly safely, reverting 'ongoing' and 'finished' to 'open' makes sense.
    // If a tournament was 'draft', it presumably doesn't have registrations to approve yet or is just being set up.
    // Let's reset 'ongoing' and 'finished' to 'open'.
    const tourResult = await Tournament.updateMany(
      { status: { $in: ["ongoing", "finished"] } },
      { status: "open" }
    );
    console.log(`✅ Reset ${tourResult.modifiedCount} tournaments to 'open'.`);

    console.log("🎉 Data reset to initial unapproved state successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset failed:", error);
    process.exit(1);
  }
};

resetData();
