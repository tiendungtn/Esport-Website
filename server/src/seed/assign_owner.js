import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";

async function assignOwner() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find user10
    const user = await User.findOne({ email: "user10@test.com" });
    if (!user) {
      console.log("❌ User user10@test.com not found");
      process.exit(1);
    }
    console.log(`✅ Found user: ${user.email} (${user._id})`);

    // Update team
    const team = await Team.findOneAndUpdate(
      { name: "Hanoi Legends" },
      {
        ownerUser: user._id,
        $addToSet: { members: user._id },
      },
      { new: true }
    );

    if (!team) {
      console.log("❌ Team 'Hanoi Legends' not found");
      process.exit(1);
    }

    console.log(`\n✅ Đã gán đội trưởng thành công!`);
    console.log(`   Team: ${team.name} (${team._id})`);
    console.log(`   Đội trưởng: ${user.email}`);
    console.log(`\n📌 Để test Registration Conflict:`);
    console.log(`   Đăng nhập: user10@test.com / 123456`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

assignOwner();
