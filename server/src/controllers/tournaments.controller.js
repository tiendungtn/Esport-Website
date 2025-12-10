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

export async function updateTournament(req, res) {
  const { id } = req.params;
  const parse = createSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const t = await Tournament.findOneAndUpdate(
    { _id: id, organizerUser: req.user.id },
    parse.data,
    { new: true }
  );
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json(t);
}

export async function deleteTournament(req, res) {
  const { id } = req.params;
  const t = await Tournament.findOneAndDelete({
    _id: id,
    organizerUser: req.user.id,
  });
  if (!t)
    return res
      .status(404)
      .json({ message: "Tournament not found or unauthorized" });
  res.json({ message: "Tournament deleted" });
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

  // Use new full bracket generation
  const { generateFullSEBracket } = await import("../utils/bracket.js");
  const matchesData = generateFullSEBracket(seeds, id);

  // Assign IDs first so we can link them
  // We need to map object references to IDs
  // existing matchesData objects have 'nextMatchRef' pointing to another object in the same array

  // 1. Give everyone an ID
  const mongoose = await import("mongoose");
  matchesData.forEach((m) => {
    m._id = new mongoose.default.Types.ObjectId();
  });

  // 2. Link IDs
  matchesData.forEach((m) => {
    if (m.nextMatchRef) {
      if (m.nextMatchSlot === "A") {
        m.nextMatchIdA = m.nextMatchRef._id;
      } else {
        m.nextMatchIdB = m.nextMatchRef._id;
      }
      // Cleanup temp props
      delete m.nextMatchRef;
      delete m.nextMatchSlot;
    }
    // Cleanup temp props
    delete m.matchIndex;
  });

  // 3. Save
  // Note: teamA/teamB might be null for non-first-rounds, which is allowed by schema?
  // Checking schema: teamA: { type: ObjectId, ref: 'Team' } - not required. OK.

  // Clean up any remaining temp props if necessary
  const created = await Match.insertMany(matchesData);

  res.status(201).json({ matches: created });
}
