import { z } from "zod";
import Match from "../models/Match.js";
import { io } from "../index.js";

export async function listMatches(req, res) {
  const { id } = req.params; // tournament id
  const matches = await Match.find({ tournamentId: id })
    .sort({ round: 1, createdAt: 1 })
    .populate("teamA", "name")
    .populate("teamB", "name");

  res.json(matches);
}

const reportSchema = z.object({
  scoreA: z.number().int().min(0),
  scoreB: z.number().int().min(0),
  proofUrls: z.array(z.string().url()).optional(),
  note: z.string().optional(),
});

export async function reportMatch(req, res) {
  const { id } = req.params; // match id
  const parse = reportSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const m = await Match.findByIdAndUpdate(
    id,
    { $set: { ...parse.data, state: "reported" } },
    { new: true }
  );

  io.to(`match:${id}`).emit("score:update", {
    matchId: id,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  });

  // Also emit to the tournament room so the bracket updates
  console.log(
    `Emitting score:update for match ${id} to tournament:${m.tournamentId}`
  );
  io.to(`tournament:${m.tournamentId}`).emit("score:update", {
    matchId: id,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  });

  res.json(m);
}

export async function updateMatch(req, res) {
  const { id } = req.params;
  const parse = reportSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const m = await Match.findByIdAndUpdate(
    id,
    { $set: parse.data },
    { new: true }
  );

  if (!m) return res.status(404).json({ message: "Match not found" });

  io.to(`match:${id}`).emit("score:update", {
    matchId: id,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  });

  // Also emit to the tournament room so the bracket updates
  console.log(
    `Emitting score:update for match ${id} to tournament:${m.tournamentId}`
  );
  io.to(`tournament:${m.tournamentId}`).emit("score:update", {
    matchId: id,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  });

  res.json(m);
}

export async function confirmMatch(req, res) {
  const { id } = req.params; // match id
  const m = await Match.findByIdAndUpdate(
    id,
    { $set: { state: "final" } },
    { new: true }
  );

  io.to(`tournament:${m.tournamentId}`).emit("match:state", {
    matchId: id,
    state: m.state,
  });

  res.json(m);
}
