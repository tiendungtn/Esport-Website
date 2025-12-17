import dotenv from "dotenv";
import mongoose from "mongoose";
import Team from "../models/Team.js";

dotenv.config();

// Map tên ảnh với tên team (dựa trên ảnh có trong thư mục img)
const imageAssignments = [
  // Các ảnh có sẵn trong thư mục img
  { imageName: "abyss_walkers.png", teamPattern: "Abyss" },
  { imageName: "aegis_division.png", teamPattern: "Aegis" },
  { imageName: "alien_hive_mascot.png", teamPattern: "Alien" },
  { imageName: "bone_collectors.png", teamPattern: "Bone" },
  { imageName: "cerberus_gate_mascot.png", teamPattern: "Cerberus" },
  { imageName: "chaos_geese.png", teamPattern: "Chaos" },
  { imageName: "crimson_tiger_mascot.png", teamPattern: "Crimson" },
  { imageName: "deadshot_gaming.png", teamPattern: "Deadshot" },
  { imageName: "delta_ascent.png", teamPattern: "Delta" },
  { imageName: "draco_legion_mascot.png", teamPattern: "Draco" },
  { imageName: "glacial_impact.png", teamPattern: "Glacial" },
  { imageName: "griffin_vanguard_mascot.png", teamPattern: "Griffin" },
  { imageName: "grim_reapers.png", teamPattern: "Grim" },
  { imageName: "hydra_heads_mascot.png", teamPattern: "Hydra" },
  { imageName: "inferno_squad.png", teamPattern: "Inferno" },
  { imageName: "ironclad_knights.png", teamPattern: "Iron" },
  { imageName: "kodiak_fury_mascot.png", teamPattern: "Kodiak" },
  { imageName: "mecha_warriors_mascot.png", teamPattern: "Mecha" },
  { imageName: "neon_syndicate_mascot.png", teamPattern: "Neon" },
  { imageName: "nexus_core.png", teamPattern: "Nexus" },
  { imageName: "orbit_gaming.png", teamPattern: "Orbit" },
  { imageName: "phantom_pain.png", teamPattern: "Phantom" },
  { imageName: "phoenix_rising_mascot.png", teamPattern: "Phoenix" },
  { imageName: "quantum_ops_mascot.png", teamPattern: "Quantum" },
  { imageName: "ronin_blades.png", teamPattern: "Ronin" },
  { imageName: "shadow_operatives.png", teamPattern: "Shadow" },
  { imageName: "silver_fang_vector.png", teamPattern: "Silver" },
  { imageName: "sky_raptor_mascot.png", teamPattern: "Sky" },
  { imageName: "sleeper_agents.png", teamPattern: "Sleeper" },
  { imageName: "spartan_phalanx.png", teamPattern: "Spartan" },
  { imageName: "spicy_bois.png", teamPattern: "Spicy" },
  { imageName: "system_glitch_mascot.png", teamPattern: "System" },
  { imageName: "tactical_taco.png", teamPattern: "Tactical" },
  { imageName: "terra_firma.png", teamPattern: "Terra" },
  { imageName: "trash_pandas.png", teamPattern: "Trash" },
  { imageName: "velocity_vector.png", teamPattern: "Velocity" },
  { imageName: "viking_raid.png", teamPattern: "Viking" },
  { imageName: "viper_strike_mascot.png", teamPattern: "Viper" },
  { imageName: "voltage_gaming.png", teamPattern: "Voltage" },
  { imageName: "vortex_tempest.png", teamPattern: "Vortex" },
];

// Danh sách tất cả các ảnh có sẵn (để gán ngẫu nhiên cho team không có match)
const allImages = [
  "abyss_walkers.png",
  "aegis_division.png",
  "alien_hive_mascot.png",
  "bone_collectors.png",
  "cerberus_gate_mascot.png",
  "chaos_geese.png",
  "crimson_tiger_mascot.png",
  "deadshot_gaming.png",
  "delta_ascent.png",
  "draco_legion_mascot.png",
  "glacial_impact.png",
  "griffin_vanguard_mascot.png",
  "grim_reapers.png",
  "hydra_heads_mascot.png",
  "inferno_squad.png",
  "ironclad_knights.png",
  "kodiak_fury_mascot.png",
  "mecha_warriors_mascot.png",
  "neon_syndicate_mascot.png",
  "nexus_core.png",
  "orbit_gaming.png",
  "phantom_pain.png",
  "phoenix_rising_mascot.png",
  "quantum_ops_mascot.png",
  "ronin_blades.png",
  "shadow_operatives.png",
  "silver_fang_vector.png",
  "sky_raptor_mascot.png",
  "sleeper_agents.png",
  "spartan_phalanx.png",
  "spicy_bois.png",
  "system_glitch_mascot.png",
  "tactical_taco.png",
  "terra_firma.png",
  "trash_pandas.png",
  "velocity_vector.png",
  "viking_raid.png",
  "viper_strike_mascot.png",
  "voltage_gaming.png",
  "vortex_tempest.png",
];

// Hàm lấy ảnh ngẫu nhiên cho team
function getRandomImage() {
  return allImages[Math.floor(Math.random() * allImages.length)];
}

// Hàm tìm ảnh phù hợp dựa trên pattern
function findMatchingImage(teamName) {
  const assignment = imageAssignments.find(a => 
    teamName.toLowerCase().includes(a.teamPattern.toLowerCase())
  );
  return assignment ? assignment.imageName : null;
}

async function assignTeamImages() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/esports");
    console.log("Connected to MongoDB!");

    // Lấy tất cả team để gán ảnh từ thư mục img
    const teams = await Team.find({});

    console.log(`Found ${teams.length} teams without logo`);

    // Base URL cho ảnh (sử dụng đường dẫn tương đối để hiển thị từ client)
    const baseUrl = "/img/";

    let updated = 0;
    for (const team of teams) {
      // Thử tìm ảnh phù hợp dựa trên tên team
      let imageName = findMatchingImage(team.name);
      
      // Nếu không tìm thấy, gán ảnh ngẫu nhiên
      if (!imageName) {
        imageName = getRandomImage();
      }

      const logoUrl = baseUrl + imageName;
      
      await Team.updateOne(
        { _id: team._id },
        { $set: { logoUrl } }
      );

      console.log(`Updated team "${team.name}" with logo: ${logoUrl}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} teams with logos`);

    // Hiển thị tất cả team sau khi cập nhật
    const allTeams = await Team.find({}).select("name logoUrl");
    console.log("\n📋 All teams with logos:");
    allTeams.forEach(t => {
      console.log(`  - ${t.name}: ${t.logoUrl || "(no logo)"}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

assignTeamImages();
