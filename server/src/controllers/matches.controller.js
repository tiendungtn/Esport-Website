import { z } from "zod";
import { io } from "../index.js";
import Match from "../models/Match.js";

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

  // Kiểm tra giới hạn tỉ số
  // Bắt buộc nghiêm ngặt: Vòng 1 = BO3, Vòng > 1 = BO5
  const requiredBestOf = existing.round === 1 ? 3 : 5;
  const bestOf = requiredBestOf;

  // Tự động sửa nếu DB sai
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

export async function rejectMatchResult(req, res) {
  const { id } = req.params;

  const match = await Match.findById(id);
  if (!match) return res.status(404).json({ message: "Match not found" });

  if (
    match.state !== "reported" &&
    match.state !== "live" &&
    match.state !== "final"
  ) {
    return res.status(400).json({
      message:
        "Match must be in 'reported', 'live', or 'final' state to reject/reset.",
    });
  }

  // Đặt lại trạng thái về live, xóa điểm số và dữ liệu báo cáo
  const m = await Match.findByIdAndUpdate(
    id,
    {
      $set: {
        state: "live",
        scoreA: 0,
        scoreB: 0,
        report: { proofUrls: [], note: null },
      },
    },
    { new: true }
  );

  // Thông báo cho clients về việc đặt lại điểm số
  io.to(`match:${id}`).emit("score:update", {
    matchId: id,
    scoreA: 0,
    scoreB: 0,
  });

  // Thông báo về thay đổi trạng thái
  io.to(`tournament:${m.tournamentId}`).emit("match:state", {
    matchId: id,
    state: "live",
  });

  // Gửi cập nhật điểm số đến room giải đấu cho bracket view
  io.to(`tournament:${m.tournamentId}`).emit("score:update", {
    matchId: id,
    scoreA: 0,
    scoreB: 0,
  });

  // Notify teams
  const teamAId = m.teamA?._id || m.teamA;
  const teamBId = m.teamB?._id || m.teamB;
  if (teamAId) io.to(`team:${teamAId}`).emit("match:state", { matchId: id, state: "live" });
  if (teamBId) io.to(`team:${teamBId}`).emit("match:state", { matchId: id, state: "live" });

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

  // Notify teams
  const teamAId = m.teamA?._id || m.teamA;
  const teamBId = m.teamB?._id || m.teamB;
  if (teamAId) io.to(`team:${teamAId}`).emit("match:state", { matchId: id, state: "final" });
  if (teamBId) io.to(`team:${teamBId}`).emit("match:state", { matchId: id, state: "final" });

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

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime().or(z.string().min(1)),
});

/**
 * Xếp lịch cho trận đấu (Tầng Vận hành)
 * Kiểm tra xung đột lịch với các trận khác của cùng đội
 */
export async function updateMatchSchedule(req, res) {
  const { id } = req.params;
  const parse = scheduleSchema.safeParse(req.body);

  if (!parse.success) {
    return res.status(400).json({ message: "Invalid scheduledAt format" });
  }

  const match = await Match.findById(id);
  if (!match) return res.status(404).json({ message: "Match not found" });

  const scheduledAt = new Date(parse.data.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    return res.status(400).json({ message: "Invalid date" });
  }

  // Thời gian buffer (2 giờ trước và sau trận)
  const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
  const timeRangeStart = new Date(scheduledAt.getTime() - MATCH_DURATION_MS);
  const timeRangeEnd = new Date(scheduledAt.getTime() + MATCH_DURATION_MS);

  // Tìm các trận khác có cùng đội trong khoảng thời gian xung đột
  const teamIds = [match.teamA, match.teamB].filter(Boolean);

  if (teamIds.length > 0) {
    const conflictingMatches = await Match.find({
      _id: { $ne: id },
      scheduledAt: {
        $gte: timeRangeStart,
        $lte: timeRangeEnd,
      },
      $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
    })
      .populate("teamA", "name")
      .populate("teamB", "name");

    if (conflictingMatches.length > 0) {
      return res.status(409).json({
        message: "Schedule conflict detected with other matches",
        code: "MATCH_SCHEDULE_CONFLICT",
        conflicts: conflictingMatches.map((m) => ({
          id: m._id,
          teamA: m.teamA?.name || "TBD",
          teamB: m.teamB?.name || "TBD",
          scheduledAt: m.scheduledAt,
          round: m.round,
        })),
      });
    }
  }

  const updated = await Match.findByIdAndUpdate(
    id,
    { $set: { scheduledAt } },
    { new: true }
  )
    .populate("teamA", "name")
    .populate("teamB", "name");

  // Thông báo cho clients
  io.to(`tournament:${match.tournamentId}`).emit("match:schedule", {
    matchId: id,
    scheduledAt: updated.scheduledAt,
  });

  // Notify teams
  const teamAId = updated.teamA?._id || updated.teamA;
  const teamBId = updated.teamB?._id || updated.teamB;
  
  if (teamAId) io.to(`team:${teamAId}`).emit("match:schedule", { matchId: id, scheduledAt: updated.scheduledAt });
  if (teamBId) io.to(`team:${teamBId}`).emit("match:schedule", { matchId: id, scheduledAt: updated.scheduledAt });

  res.json(updated);
}
