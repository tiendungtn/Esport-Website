import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Registration from "../models/Registration.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, "full_database_export.json");

// Map to track old ID -> new ID for references
const idMaps = {
  users: new Map(),
  teams: new Map(),
  tournaments: new Map(),
  matches: new Map(),
};

// Helper function to convert string ID to ObjectId if valid
function toObjectId(id) {
  if (!id) return null;
  if (id instanceof mongoose.Types.ObjectId) return id;
  if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  if (id.$oid) {
    return new mongoose.Types.ObjectId(id.$oid);
  }
  return null;
}

// Helper to get mapped ID or original
function getMappedId(map, oldId) {
  if (!oldId) return null;
  const stringId = oldId.toString ? oldId.toString() : oldId.$oid || oldId;
  return map.get(stringId) || toObjectId(oldId);
}

async function importAllData() {
  try {
    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`❌ Không tìm thấy file: ${INPUT_FILE}`);
      console.log(
        "💡 Hãy chạy script exportAllData.js trước để tạo file dữ liệu."
      );
      process.exit(1);
    }

    await connectDB(process.env.MONGO_URI);
    console.log("📦 Bắt đầu nhập dữ liệu vào database...\n");

    // Read export file
    const exportData = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
    const { data, stats, exportedAt } = exportData;

    console.log(
      `📅 Dữ liệu được xuất lúc: ${new Date(exportedAt).toLocaleString(
        "vi-VN"
      )}`
    );
    console.log("\n" + "=".repeat(50));
    console.log("📊 DỮ LIỆU SẼ ĐƯỢC NHẬP:");
    console.log("=".repeat(50));
    console.log(`   👤 Users:         ${stats.totalUsers}`);
    console.log(`   🏷️  Teams:         ${stats.totalTeams}`);
    console.log(`   🏆 Tournaments:   ${stats.totalTournaments}`);
    console.log(`   ⚔️  Matches:       ${stats.totalMatches}`);
    console.log(`   📝 Registrations: ${stats.totalRegistrations}`);
    console.log("=".repeat(50) + "\n");

    // ========== STEP 1: Import Users ==========
    console.log("👤 [1/5] Đang nhập Users...");
    let usersImported = 0;
    let usersSkipped = 0;

    for (const user of data.users) {
      const oldId = user._id.toString
        ? user._id.toString()
        : user._id.$oid || user._id;

      // Check if user with same email already exists
      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        idMaps.users.set(oldId, existingUser._id);
        usersSkipped++;
        continue;
      }

      const newUser = await User.create({
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
        profile: user.profile || {},
      });
      idMaps.users.set(oldId, newUser._id);
      usersImported++;
    }
    console.log(
      `   ✅ Đã nhập: ${usersImported}, Bỏ qua (trùng): ${usersSkipped}`
    );

    // ========== STEP 2: Import Teams ==========
    console.log("🏷️  [2/5] Đang nhập Teams...");
    let teamsImported = 0;
    let teamsSkipped = 0;

    for (const team of data.teams) {
      const oldId = team._id.toString
        ? team._id.toString()
        : team._id.$oid || team._id;

      // Check if team with same name and game already exists
      const existingTeam = await Team.findOne({
        name: team.name,
        game: team.game,
      });
      if (existingTeam) {
        idMaps.teams.set(oldId, existingTeam._id);
        teamsSkipped++;
        continue;
      }

      // Map owner and members to new IDs
      const ownerOldId = team.ownerUser?.toString
        ? team.ownerUser.toString()
        : team.ownerUser?.$oid || team.ownerUser;
      const mappedOwner =
        getMappedId(idMaps.users, ownerOldId) || new mongoose.Types.ObjectId();

      const mappedMembers = (team.members || [])
        .map((memberId) => {
          const memberOldId = memberId?.toString
            ? memberId.toString()
            : memberId?.$oid || memberId;
          return getMappedId(idMaps.users, memberOldId);
        })
        .filter(Boolean);

      const newTeam = await Team.create({
        name: team.name,
        tag: team.tag,
        game: team.game,
        logoUrl: team.logoUrl,
        ownerUser: mappedOwner,
        members: mappedMembers,
      });
      idMaps.teams.set(oldId, newTeam._id);
      teamsImported++;
    }
    console.log(
      `   ✅ Đã nhập: ${teamsImported}, Bỏ qua (trùng): ${teamsSkipped}`
    );

    // ========== STEP 3: Import Tournaments ==========
    console.log("🏆 [3/5] Đang nhập Tournaments...");
    let tournamentsImported = 0;
    let tournamentsSkipped = 0;

    for (const tournament of data.tournaments) {
      const oldId = tournament._id.toString
        ? tournament._id.toString()
        : tournament._id.$oid || tournament._id;

      // Check if tournament with same name already exists
      const existingTournament = await Tournament.findOne({
        name: tournament.name,
      });
      if (existingTournament) {
        idMaps.tournaments.set(oldId, existingTournament._id);
        tournamentsSkipped++;
        continue;
      }

      // Map organizer to new ID
      const organizerOldId = tournament.organizerUser?.toString
        ? tournament.organizerUser.toString()
        : tournament.organizerUser?.$oid || tournament.organizerUser;
      const mappedOrganizer =
        getMappedId(idMaps.users, organizerOldId) ||
        new mongoose.Types.ObjectId();

      const newTournament = await Tournament.create({
        name: tournament.name,
        game: tournament.game,
        bannerUrl: tournament.bannerUrl,
        description: tournament.description,
        rules: tournament.rules,
        format: tournament.format,
        status: tournament.status,
        maxTeams: tournament.maxTeams,
        schedule: tournament.schedule,
        organizerUser: mappedOrganizer,
      });
      idMaps.tournaments.set(oldId, newTournament._id);
      tournamentsImported++;
    }
    console.log(
      `   ✅ Đã nhập: ${tournamentsImported}, Bỏ qua (trùng): ${tournamentsSkipped}`
    );

    // ========== STEP 4: Import Matches ==========
    console.log("⚔️  [4/5] Đang nhập Matches...");
    let matchesImported = 0;
    let matchesSkipped = 0;

    // First pass: create matches without nextMatch references
    for (const match of data.matches) {
      const oldId = match._id.toString
        ? match._id.toString()
        : match._id.$oid || match._id;

      // Map tournament ID
      const tournamentOldId = match.tournamentId?.toString
        ? match.tournamentId.toString()
        : match.tournamentId?.$oid || match.tournamentId;
      const mappedTournamentId = getMappedId(
        idMaps.tournaments,
        tournamentOldId
      );

      if (!mappedTournamentId) {
        console.log(`   ⚠️ Bỏ qua match (tournament không tồn tại): ${oldId}`);
        matchesSkipped++;
        continue;
      }

      // Check if match already exists
      const existingMatch = await Match.findOne({
        tournamentId: mappedTournamentId,
        round: match.round,
        stage: match.stage,
      });
      if (existingMatch) {
        idMaps.matches.set(oldId, existingMatch._id);
        matchesSkipped++;
        continue;
      }

      // Map team IDs
      const teamAOldId = match.teamA?.toString
        ? match.teamA.toString()
        : match.teamA?.$oid || match.teamA;
      const teamBOldId = match.teamB?.toString
        ? match.teamB.toString()
        : match.teamB?.$oid || match.teamB;
      const mappedTeamA = getMappedId(idMaps.teams, teamAOldId);
      const mappedTeamB = getMappedId(idMaps.teams, teamBOldId);

      // Map report submitter
      let mappedReport = null;
      if (match.report) {
        const submitterOldId = match.report.submitter?.toString
          ? match.report.submitter.toString()
          : match.report.submitter?.$oid || match.report.submitter;
        mappedReport = {
          submitter: getMappedId(idMaps.users, submitterOldId),
          proofUrls: match.report.proofUrls || [],
          note: match.report.note,
        };
      }

      const newMatch = await Match.create({
        tournamentId: mappedTournamentId,
        stage: match.stage,
        round: match.round,
        bestOf: match.bestOf,
        teamA: mappedTeamA,
        teamB: mappedTeamB,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        state: match.state,
        scheduledAt: match.scheduledAt,
        report: mappedReport,
        // nextMatchIdA and nextMatchIdB will be updated in second pass
      });
      idMaps.matches.set(oldId, newMatch._id);
      matchesImported++;
    }

    // Second pass: update nextMatch references
    for (const match of data.matches) {
      const oldId = match._id.toString
        ? match._id.toString()
        : match._id.$oid || match._id;
      const newMatchId = idMaps.matches.get(oldId);

      if (!newMatchId) continue;

      const updates = {};

      if (match.nextMatchIdA) {
        const nextAOldId = match.nextMatchIdA.toString
          ? match.nextMatchIdA.toString()
          : match.nextMatchIdA.$oid || match.nextMatchIdA;
        updates.nextMatchIdA = getMappedId(idMaps.matches, nextAOldId);
      }

      if (match.nextMatchIdB) {
        const nextBOldId = match.nextMatchIdB.toString
          ? match.nextMatchIdB.toString()
          : match.nextMatchIdB.$oid || match.nextMatchIdB;
        updates.nextMatchIdB = getMappedId(idMaps.matches, nextBOldId);
      }

      if (Object.keys(updates).length > 0) {
        await Match.findByIdAndUpdate(newMatchId, updates);
      }
    }
    console.log(
      `   ✅ Đã nhập: ${matchesImported}, Bỏ qua (trùng/lỗi): ${matchesSkipped}`
    );

    // ========== STEP 5: Import Registrations ==========
    console.log("📝 [5/5] Đang nhập Registrations...");
    let registrationsImported = 0;
    let registrationsSkipped = 0;

    for (const registration of data.registrations) {
      // Map tournament and team IDs
      const tournamentOldId = registration.tournamentId?.toString
        ? registration.tournamentId.toString()
        : registration.tournamentId?.$oid || registration.tournamentId;
      const teamOldId = registration.teamId?.toString
        ? registration.teamId.toString()
        : registration.teamId?.$oid || registration.teamId;

      const mappedTournamentId = getMappedId(
        idMaps.tournaments,
        tournamentOldId
      );
      const mappedTeamId = getMappedId(idMaps.teams, teamOldId);

      if (!mappedTournamentId || !mappedTeamId) {
        console.log(
          `   ⚠️ Bỏ qua registration (tournament/team không tồn tại)`
        );
        registrationsSkipped++;
        continue;
      }

      // Check if registration already exists
      const existingReg = await Registration.findOne({
        tournamentId: mappedTournamentId,
        teamId: mappedTeamId,
      });
      if (existingReg) {
        registrationsSkipped++;
        continue;
      }

      await Registration.create({
        tournamentId: mappedTournamentId,
        teamId: mappedTeamId,
        status: registration.status,
        seed: registration.seed,
      });
      registrationsImported++;
    }
    console.log(
      `   ✅ Đã nhập: ${registrationsImported}, Bỏ qua (trùng/lỗi): ${registrationsSkipped}`
    );

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(50));
    console.log("📊 KẾT QUẢ NHẬP DỮ LIỆU:");
    console.log("=".repeat(50));
    console.log(
      `   👤 Users:         ${usersImported} nhập, ${usersSkipped} bỏ qua`
    );
    console.log(
      `   🏷️  Teams:         ${teamsImported} nhập, ${teamsSkipped} bỏ qua`
    );
    console.log(
      `   🏆 Tournaments:   ${tournamentsImported} nhập, ${tournamentsSkipped} bỏ qua`
    );
    console.log(
      `   ⚔️  Matches:       ${matchesImported} nhập, ${matchesSkipped} bỏ qua`
    );
    console.log(
      `   📝 Registrations: ${registrationsImported} nhập, ${registrationsSkipped} bỏ qua`
    );
    console.log("=".repeat(50));
    console.log("\n✅ Đã nhập xong tất cả dữ liệu!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi nhập dữ liệu:", error);
    process.exit(1);
  }
}

importAllData();
