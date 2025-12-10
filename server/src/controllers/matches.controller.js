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

  const existing = await Match.findById(id);
  if (!existing) return res.status(404).json({ message: "Match not found" });

  // Validate Score Limits
  // Validate Score Limits
  // Strict Enforcement: Round 1 = BO3, Round > 1 = BO5
  const requiredBestOf = existing.round === 1 ? 3 : 5;
  const bestOf = requiredBestOf;

  // Auto-heal if DB is wrong
  if (existing.bestOf !== requiredBestOf) {
    await Match.findByIdAndUpdate(id, { $set: { bestOf: requiredBestOf } });
  }

  const maxScore = Math.ceil(bestOf / 2);

  if (
    (parse.data.scoreA !== undefined && parse.data.scoreA > maxScore) ||
    (parse.data.scoreB !== undefined && parse.data.scoreB > maxScore)
  ) {
    return res.status(400).json({
      message: `Score cannot exceed ${maxScore} for a Best of ${bestOf} match.`,
      code: "SCORE_LIMIT_EXCEEDED",
      params: { max: maxScore, bestOf },
    });
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

  const existing = await Match.findById(id);
  if (!existing) return res.status(404).json({ message: "Match not found" });

  if (req.body.state !== "final" && existing.state === "final") {
    // Prevent updating a final match unless we are specifically dealing with an admin override?
    // User requirement: "không được cập nhật tỉ số sau khi kết thúc trận"
    return res.status(400).json({
      message: "Cannot update a finalized match.",
      code: "MATCH_FINALIZED",
    });
  }

  // Validate Score Limits
  // Validate Score Limits
  // Strict Enforcement: Round 1 = BO3, Round > 1 = BO5
  const requiredBestOf = existing.round === 1 ? 3 : 5;
  const bestOf = requiredBestOf;

  // Auto-heal if DB is wrong
  if (existing.bestOf !== requiredBestOf) {
    await Match.findByIdAndUpdate(id, { $set: { bestOf: requiredBestOf } });
  }

  const maxScore = Math.ceil(bestOf / 2);

  if (
    (parse.data.scoreA !== undefined && parse.data.scoreA > maxScore) ||
    (parse.data.scoreB !== undefined && parse.data.scoreB > maxScore)
  ) {
    return res.status(400).json({
      message: `Score cannot exceed ${maxScore} for a Best of ${bestOf} match.`,
      code: "SCORE_LIMIT_EXCEEDED",
      params: { max: maxScore, bestOf },
    });
  }

  const m = await Match.findByIdAndUpdate(
    id,
    { $set: parse.data },
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

export async function confirmMatch(req, res) {
  const { id } = req.params; // match id

  // 1. Get current match to check scores and next match links
  const m = await Match.findById(id);
  if (!m) return res.status(404).json({ message: "Match not found" });

  if (m.state === "final") {
    return res.json(m); // Already final
  }

  // 2. Determine winner
  // 2. Validate Best Of Rules
  // Requirement: First round (1) is BO3. Others are BO5.
  // We enforce this logic and auto-corret DB if needed.
  const requiredBestOf = m.round === 1 ? 3 : 5;
  if (m.bestOf !== requiredBestOf) {
    m.bestOf = requiredBestOf;
    await m.save();
  }

  const winsNeeded = Math.ceil(m.bestOf / 2);
  // BO3 (3/2=1.5->2 wins). BO5 (5/2 -> 3 wins).

  if (m.scoreA < winsNeeded && m.scoreB < winsNeeded) {
    return res.status(400).json({
      message: `Match cannot be finished. Requires ${winsNeeded} wins (Best of ${m.bestOf}). Current: ${m.scoreA}-${m.scoreB}`,
      code: "CONFIRM_WINS_NEEDED",
      params: { needed: winsNeeded, bestOf: m.bestOf },
    });
  }

  let winnerId = null;
  if (m.scoreA > m.scoreB) {
    winnerId = m.teamA;
  } else if (m.scoreB > m.scoreA) {
    winnerId = m.teamB;
  }

  if (!winnerId) {
    return res.status(400).json({ message: "No winner determined." });
  }

  // 3. Update current match state
  m.state = "final";
  await m.save();

  io.to(`tournament:${m.tournamentId}`).emit("match:state", {
    matchId: id,
    state: m.state,
  });

  // 4. Advance winner if exists
  if (winnerId) {
    let nextMatchId = null;
    let slot = null;

    if (m.nextMatchIdA) {
      nextMatchId = m.nextMatchIdA;
      slot = "teamA";
    } else if (m.nextMatchIdB) {
      nextMatchId = m.nextMatchIdB;
      slot = "teamB";
    }

    if (nextMatchId && slot) {
      const nextMatch = await Match.findByIdAndUpdate(
        nextMatchId,
        { $set: { [slot]: winnerId } },
        { new: true }
      );

      if (nextMatch) {
        console.log(
          `Advanced winner ${winnerId} to match ${nextMatchId} slot ${slot}`
        );
        // Emit update for the next match so UI shows the team
        io.to(`tournament:${m.tournamentId}`).emit("match:update", {
          match: nextMatch,
        });
        // Also specifically emit score:update if we want to refresh teams?
        // Usually simpler to just refetch or emit a full match update event.
        // The client likely listens to score:update, match:state.
        // Let's check client listeners later. For now, sending a generic socket event
        // might be useful, or piggyback on score:update with null scores?
        // Actually, if we just updated the team, we should emit that.
        // There isn't a "match:update" event standard yet in previous code,
        // but let's add it or use "score:update" which transmits A/B scores?
        // Better: "bracket:update" or just let the user refresh.
        // But let's try to be helpful.
        io.to(`tournament:${m.tournamentId}`).emit("score:update", {
          matchId: nextMatchId,
          teamA: nextMatch.teamA, // Only sending IDs might be confusing if client expects scores
          teamB: nextMatch.teamB,
          // Client probably re-fetches or we need to look at client code.
        });
      }
    }
  }

  res.json(m);
}
