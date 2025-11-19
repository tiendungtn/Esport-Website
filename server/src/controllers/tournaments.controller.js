import { z } from "zod";
import Tournament from "../models/Tournament.js";
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

const registerSchema = z.object({
  teamId: z.string().min(1),
});

export async function registerTeam(req, res) {
  const { id } = req.params; // tournamentId
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const reg = await Registration.create({
      tournamentId: id,
      teamId: parse.data.teamId,
      status: "approved", // cho đơn giản: auto-approve
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

  const pairs = generateSERoundPairs(seeds);
  const created = [];

  for (const [a, b] of pairs) {
    const m = await Match.create({
      tournamentId: id,
      teamA: a,
      teamB: b,
      round: 1,
      state: "scheduled",
    });
    created.push(m);
  }

  res.status(201).json({ matches: created });
}
