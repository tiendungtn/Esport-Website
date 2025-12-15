import "dotenv/config";
import { connectDB } from "../config/db.js";
import Tournament from "../models/Tournament.js";

async function checkData() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find test2 tournament specifically
    const t = await Tournament.findOne({ name: /test2/i }).lean();

    if (t) {
      console.log("\n=== Tournament test2 ===");
      console.log("Name:", t.name);
      console.log("Schedule:", JSON.stringify(t.schedule, null, 2));
      console.log("Full document:", JSON.stringify(t, null, 2));
    } else {
      console.log("Tournament 'test2' not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkData();
