import { z } from "zod";
import Match from "../models/Match.js";
import { io } from "../index.js";

export async function listMatches(req, res) {
  const { id } = req.params; // ID giải đấu
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
  const { id } = req.params; // ID trận đấu
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

  // Gửi sự kiện update cho room giải đấu để cập nhật bracket
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
    // Không cho phép cập nhật trận đấu đã kết thúc
    return res.status(400).json({
      message: "Cannot update a finalized match.",
      code: "MATCH_FINALIZED",
    });
  }

  // Kiểm tra giới hạn tỉ số
  // Bắt buộc: Vòng 1 là BO3, các vòng sau là BO5
  const requiredBestOf = existing.round === 1 ? 3 : 5;
  const bestOf = requiredBestOf;

  // Tự sửa nếu DB sai
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

  // Gửi sự kiện update cho room giải đấu để cập nhật bracket
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
  const { id } = req.params; // ID trận đấu

  // 1. Lấy trận đấu hiện tại để kiểm tra tỉ số và các trận tiếp theo
  const m = await Match.findById(id);
  if (!m) return res.status(404).json({ message: "Match not found" });

  if (m.state === "final") {
    return res.json(m); // Đã kết thúc
  }

  // 2. Xác định người thắng
  // Kiểm tra luật Best Of: Vòng 1 là BO3, còn lại BO5
  // Tự động sửa lại DB nếu cần
  const requiredBestOf = m.round === 1 ? 3 : 5;
  if (m.bestOf !== requiredBestOf) {
    m.bestOf = requiredBestOf;
    await m.save();
  }

  const winsNeeded = Math.ceil(m.bestOf / 2);
  // BO3 cần 2 thắng (3/2=1.5->2). BO5 cần 3 thắng (5/2 -> 3).

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

  // 3. Cập nhật trạng thái trận đấu
  m.state = "final";
  await m.save();

  io.to(`tournament:${m.tournamentId}`).emit("match:state", {
    matchId: id,
    state: m.state,
  });

  // 4. Đưa người thắng vào vòng trong (nếu có)
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
        // Gửi update cho trận tiếp theo để UI hiển thị team
        io.to(`tournament:${m.tournamentId}`).emit("match:update", {
          match: nextMatch,
        });

        io.to(`tournament:${m.tournamentId}`).emit("score:update", {
          matchId: nextMatchId,
          teamA: nextMatch.teamA,
          teamB: nextMatch.teamB,
        });
      }
    }
  }

  res.json(m);
}
