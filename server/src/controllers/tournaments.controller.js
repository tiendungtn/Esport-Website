import { z } from "zod";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Registration from "../models/Registration.js";
import Match from "../models/Match.js";
import {
  seedingByRegistration,
  generateSERoundPairs,
} from "../utils/bracket.js";

const createSchema = z.object({
  name: z.string().min(3),
  game: z.string().min(2),
  format: z.enum(["SE", "DE", "RR"]).default("SE"),
  maxTeams: z.number().int().min(2).max(128).default(16),
  description: z.string().optional(),
  schedule: z
    .object({
      regOpen: z.string().optional(),
      regClose: z.string().optional(),
    })
    .optional(),
});

export async function createTournament(req, res) {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const t = await Tournament.create({
    ...parse.data,
    status: "open",
    organizerUser: req.user?.id ?? null,
  });

  res.status(201).json(t);
}

export async function listTournaments(req, res) {
  const { status, game } = req.query;
  const query = {};
  if (status) query.status = status;
  if (game) query.game = game;

  const tournaments = await Tournament.find(query)
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(tournaments);
}

export async function getTournament(req, res) {
  const { id } = req.params;
  const t = await Tournament.findById(id);
  if (!t) return res.status(404).json({ message: "Tournament not found" });
  res.json(t);
}

export async function updateTournament(req, res) {
  const { id } = req.params;
  const parse = createSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const query = { _id: id };
  if (req.user.role !== "admin") {
    query.organizerUser = req.user.id;
  }

  const t = await Tournament.findOneAndUpdate(query, parse.data, { new: true });
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json(t);
}

export async function deleteTournament(req, res) {
  const { id } = req.params;

  const query = { _id: id };
  if (req.user.role !== "admin") {
    query.organizerUser = req.user.id;
  }

  const t = await Tournament.findOneAndDelete(query);
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json({ message: "Tournament deleted" });
}

const registerSchema = z.object({
  teamId: z.string().min(1),
});

const MIN_MEMBERS_MAPPING = {
  "League of Legends": 5,
  "Liên Minh Huyền Thoại": 5,
  "Wild Rift": 5,
  "Tốc Chiến": 5,
  "Arena of Valor": 5,
  "Liên Quân": 5,
  Valorant: 5,
  CS2: 5,
  "FC Online": 1,
};

const NORMALIZE_GAME_NAME = {
  "Liên Minh Huyền Thoại": "League of Legends",
  "League of Legends": "League of Legends",
  "Đấu Trường Chân Lý": "TFT",
  TFT: "TFT",
  "Liên Quân Mobile": "Arena of Valor",
  "Arena of Valor": "Arena of Valor",
  Valorant: "Valorant",
  CS2: "CS2",
  "FC Online": "FC Online",
};

export async function registerTeam(req, res) {
  const { id } = req.params; // tournamentId
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });

    const team = await Team.findById(parse.data.teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Kiểm tra thời gian Registration
    if (
      tournament.schedule?.regClose &&
      new Date() > new Date(tournament.schedule.regClose)
    ) {
      return res.status(400).json({
        message: "Registration is closed for this tournament.",
      });
    }

    // Validate Game Matching
    const teamGame = NORMALIZE_GAME_NAME[team.game] || team.game;
    const tourGame = NORMALIZE_GAME_NAME[tournament.game] || tournament.game;

    if (team.game && teamGame !== tourGame) {
      return res.status(400).json({
        message: `Team game (${team.game}) does not match tournament game (${tournament.game})`,
      });
    }

    // Validate Min Members
    const minRequired = MIN_MEMBERS_MAPPING[tournament.game] || 1;
    if (team.members.length < minRequired) {
      return res.status(400).json({
        message: `Team must have at least ${minRequired} members to register for ${tournament.game}`,
      });
    }

    // Check if user is authorized (Owner only)
    if (team.ownerUser.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the team captain can register for tournaments",
      });
    }

    const reg = await Registration.create({
      tournamentId: id,
      teamId: parse.data.teamId,
      status: "pending", // Chờ duyệt status: "pending"
    });
    res.status(201).json(reg);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Team already registered for this tournament" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not register team" });
  }
}

const seedSchema = z.object({
  seeds: z
    .array(
      z.object({
        teamId: z.string(),
        seed: z.number().int().min(1),
      })
    )
    .optional(),
});

export async function seedTournament(req, res) {
  const { id } = req.params;

  // 1. Validation Payload
  const parse = seedSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }
  const manualSeeds = parse.data.seeds;

  // 2. Lay tat ca dang ky
  const regs = await Registration.find({ tournamentId: id }).sort({
    createdAt: 1,
  });

  if (manualSeeds && manualSeeds.length > 0) {
    // 3. Manual Seeding Logic
    // Validate: tat ca teamId phai thuoc tournament nay
    const regTeamIds = new Set(regs.map((r) => r.teamId.toString()));
    const inputTeamIds = new Set(manualSeeds.map((s) => s.teamId));

    for (const inId of inputTeamIds) {
      if (!regTeamIds.has(inId)) {
        return res.status(400).json({
          message: `Team ID ${inId} is not registered for this tournament`,
        });
      }
    }

    // Validate: seed khong duoc trung nhau
    const seedValues = manualSeeds.map((s) => s.seed);
    const uniqueSeeds = new Set(seedValues);
    if (seedValues.length !== uniqueSeeds.size) {
      return res.status(400).json({
        message: "Không được đặt cùng seed (Duplicate seeds not allowed)",
      });
    }

    // Map seed input
    const seedMap = new Map(); // teamId -> seed
    manualSeeds.forEach((s) => seedMap.set(s.teamId, s.seed));

    // Update regs
    // Note: Nhung team khong co trong manualSeeds se co seed = null (hoac giu seed cu neu muon, o day ta set theo logic cua user yeu cau la loop through)
    // User request logic: "If req.body.seeds is provided, loop through the registrations and update their seed field based on the input."
    // Impl: Update provided, others undefined? Or error if missing?
    // Usually manual seeding implies full seeding or partial. Let's assume partial is allowed but better to be safe.
    // Requirement says: "loop through the registrations and update their seed field based on the input."
    // Let's ensure we save the seed.
    await Promise.all(
      regs.map((r) => {
        const s = seedMap.get(r.teamId.toString());
        if (s !== undefined) {
          r.seed = s;
        } else {
          // If not provided, maybe leave it or set to null?
          // Let's keep it clean: if switching to manual, maybe we expect full coverage?
          // User diagram implies sending specific seeds.
          // Let's just update matches.
        }
        return r.save();
      })
    );
  } else {
    // 4. Fallback Auto Seeding (Sort by createdAt)
    // regs da duoc sort createdAt: 1 o tren
    await Promise.all(
      regs.map((r, idx) => {
        r.seed = idx + 1;
        return r.save();
      })
    );
  }

  // Refetch to return clear state
  const updatedRegs = await Registration.find({ tournamentId: id }).sort({
    seed: 1,
  });
  res.json(updatedRegs);
}

/* Helper function for bracket generation */
async function generateBracketInternal(tournamentId) {
  // Check if matches already exist
  const existingMatches = await Match.countDocuments({ tournamentId });
  if (existingMatches > 0) {
    return { skipped: true, reason: "Bracket already exists" };
  }

  const regs = await Registration.find({
    tournamentId: tournamentId,
    status: "approved",
  }).lean();

  const seeds = seedingByRegistration(regs);
  if (seeds.length < 2) {
    return { skipped: true, reason: "Not enough teams to generate bracket" };
  }

  // Use the bracket generation algorithm
  const { generateFullSEBracket } = await import("../utils/bracket.js");
  const matchesData = generateFullSEBracket(seeds, tournamentId);

  // Save to DB
  const created = await Match.insertMany(matchesData);

  // Optionally update tournament status
  await Tournament.findByIdAndUpdate(tournamentId, { status: "ongoing" });

  return { skipped: false, matches: created };
}

export async function generateBracket(req, res) {
  const { id } = req.params;

  // Check pending
  const pendingCount = await Registration.countDocuments({
    tournamentId: id,
    status: "pending",
  });

  if (pendingCount > 0) {
    return res.status(400).json({
      message: "Cannot generate bracket while there are pending registrations.",
    });
  }

  try {
    const result = await generateBracketInternal(id);
    if (result.skipped) {
      return res.status(400).json({ message: result.reason });
    }
    res.status(201).json({ matches: result.matches });
  } catch (error) {
    console.error("Bracket generation error:", error);
    res.status(500).json({ message: "Failed to generate bracket" });
  }
}

export async function getTournamentRegistrations(req, res) {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.organizerUser?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }

  const registrations = await Registration.find({ tournamentId: id })
    .populate("teamId") // Để lấy thông tin team (name, logo, members...)
    .sort({ createdAt: -1 });

  res.json(registrations);
}

export async function updateRegistrationStatus(req, res) {
  const { id, regId } = req.params;
  const { status } = req.body; // 'approved' | 'rejected' | 'pending'

  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (req.user.role !== "admin") {
    const tournament = await Tournament.findById(id);
    if (!tournament)
      return res.status(404).json({ message: "Tournament not found" });
    if (tournament.organizerUser?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  }

  const reg = await Registration.findOneAndUpdate(
    { _id: regId, tournamentId: id },
    { status },
    { new: true }
  );

  if (!reg) return res.status(404).json({ message: "Registration not found" });

  // Auto-generate bracket if all registrations are processed
  try {
    const pendingCount = await Registration.countDocuments({
      tournamentId: id,
      status: "pending",
    });

    if (pendingCount === 0) {
      console.log(
        `All registrations processed for tournament ${id}. Attempting to generate bracket...`
      );
      await generateBracketInternal(id);
    }
  } catch (err) {
    console.error("Auto bracket generation failed:", err);
  }

  res.json(reg);
}
