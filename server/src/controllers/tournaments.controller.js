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

    // Validate Game Matching
    if (team.game && team.game !== tournament.game) {
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

    // Check if user is authorized (Owner or Captain validation could go here, but omitted for brevity/scope)

    const reg = await Registration.create({
      tournamentId: id,
      teamId: parse.data.teamId,
      status: "approved", // Tự động duyệt
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

export async function seedTournament(req, res) {
  const { id } = req.params;
  const regs = await Registration.find({ tournamentId: id }).sort({
    createdAt: 1,
  });

  await Promise.all(
    regs.map((r, idx) => {
      r.seed = idx + 1;
      return r.save();
    })
  );

  res.json(regs);
}

export async function generateBracket(req, res) {
  const { id } = req.params;
  const regs = await Registration.find({
    tournamentId: id,
    status: "approved",
  }).lean();

  const seeds = seedingByRegistration(regs);
  if (seeds.length < 2) {
    return res.status(400).json({ message: "Not enough teams" });
  }

  // Sử dụng thuật toán tạo bracket đầy đủ mới (đã bao gồm ID và Linking)
  const { generateFullSEBracket } = await import("../utils/bracket.js");
  const matchesData = generateFullSEBracket(seeds, id);

  // Lưu vào DB
  // Lưu ý: teamA/teamB có thể null cho các vòng sau (được phép theo schema)
  const created = await Match.insertMany(matchesData);

  res.status(201).json({ matches: created });
}
