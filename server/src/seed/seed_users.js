import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js"; // Adjust path as needed based on file location
import User from "../models/User.js";

const seedUsers = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("Connected to DB for seeding users...");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("123456", salt);

    const users = [];
    for (let i = 1; i <= 20; i++) {
      users.push({
        email: `user${i}@test.com`,
        passwordHash: passwordHash,
        role: "player",
        profile: {
          displayName: `User ${i}`,
          avatar: "", // specific avatar logic if needed, else empty
          phone: `123456789${i}`,
        },
      });
    }

    // Optional: Clear existing users matching this pattern or just insert
    // For safety, let's just create. If they exist, unique constraint on email might fail.
    // Handling duplications:
    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Created ${u.email}`);
      } else {
        console.log(`Skipped ${u.email} (already exists)`);
      }
    }

    console.log("✅ User seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
};

seedUsers();
