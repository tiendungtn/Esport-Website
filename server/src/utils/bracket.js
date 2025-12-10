import mongoose from "mongoose";

/** Tiện ích tạo nhánh đấu */

export function padToPowerOfTwo(list) {
  const size = 1 << Math.ceil(Math.log2(Math.max(list.length, 1)));
  return list.concat(Array(Math.max(0, size - list.length)).fill(null));
}

export function seedingByRegistration(regs) {
  // regs: [{teamId, seed?}] -> trả về mảng teamId sắp xếp theo hạt giống hoặc thứ tự gốc
  return [...regs]
    .sort((a, b) => (a.seed ?? Infinity) - (b.seed ?? Infinity))
    .map((r) => r.teamId);
}

export function generateSERoundPairs(teamIds) {
  const padded = padToPowerOfTwo(teamIds);
  const n = padded.length;
  const pairs = [];
  for (let i = 0; i < n / 2; i++) pairs.push([padded[i], padded[n - 1 - i]]);
  return pairs;
}

/**
 * Tạo cấu trúc nhánh đấu loại trực tiếp (Single Elimination) đầy đủ.
 * @param {string[]} teamIds - Mảng ID đội (sẽ được làm đầy).
 * @param {string} tournamentId - ID giải đấu.
 * @returns {object[]} Mảng đối tượng trận đấu (đã có ID và liên kết, sẵn sàng save).
 */
export function generateFullSEBracket(teamIds, tournamentId) {
  const padded = padToPowerOfTwo(teamIds);
  const n = padded.length; // Power of 2
  const totalRounds = Math.log2(n);

  // 1. Tạo cấu trúc các vòng đấu
  const rounds = {};

  // Tạo trận đấu và ID trước
  for (let r = 1; r <= totalRounds; r++) {
    rounds[r] = [];
    const matchCount = n / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      rounds[r].push({
        _id: new mongoose.Types.ObjectId(), // Tạo ID ngay lập tức
        tournamentId,
        round: r,
        bestOf: r === 1 ? 3 : 5, // Round 1 BO3, others BO5
        matchIndex: i, // dùng để truy xuất
        // Init fields
        teamA: null,
        teamB: null,
        scoreA: 0,
        scoreB: 0,
        state: "scheduled",
      });
    }
  }

  // 2. Liên kết các vòng (nextMatchId)
  for (let r = 1; r < totalRounds; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    for (let i = 0; i < currentRound.length; i++) {
      const currentMatch = currentRound[i];
      const parentIndex = Math.floor(i / 2);
      const parentMatch = nextRound[parentIndex];

      // Index chẵn -> Slot A, Lẻ -> Slot B
      if (i % 2 === 0) {
        currentMatch.nextMatchIdA = parentMatch._id;
        // Giữ tham chiếu để dễ xử lý logic Bye bên dưới
        currentMatch.nextMatchRef = parentMatch;
        currentMatch.nextMatchSlot = "A";
      } else {
        currentMatch.nextMatchIdB = parentMatch._id;
        currentMatch.nextMatchRef = parentMatch;
        currentMatch.nextMatchSlot = "B";
      }
    }
  }

  // 3. Gán team cho Vòng 1 và Xử lý Bye
  const round1Pairs = generateSERoundPairs(padded);

  round1Pairs.forEach((pair, idx) => {
    const match = rounds[1][idx];
    if (match) {
      match.teamA = pair[0]; // Có thể là ID hoặc null
      match.teamB = pair[1]; // Có thể là ID hoặc null

      // Xử lý Bye ngay tại đây
      // Bye xảy ra khi 1 trong 2 team là null
      const hasTeamA = !!match.teamA;
      const hasTeamB = !!match.teamB;

      if (hasTeamA && !hasTeamB) {
        // A thắng
        match.state = "final"; // Đánh dấu hoàn thành
        match.scoreA = 2; // Giả định thắng tuyệt đối
        match.scoreB = 0;
        // Advance A
        if (match.nextMatchRef) {
          if (match.nextMatchSlot === "A")
            match.nextMatchRef.teamA = match.teamA;
          else match.nextMatchRef.teamB = match.teamA;
        }
      } else if (!hasTeamA && hasTeamB) {
        // B thắng
        match.state = "final";
        match.scoreA = 0;
        match.scoreB = 2;
        // Advance B
        if (match.nextMatchRef) {
          if (match.nextMatchSlot === "A")
            match.nextMatchRef.teamA = match.teamB;
          else match.nextMatchRef.teamB = match.teamB;
        }
      }
    }
  });

  // 4. Cleanup và Flatten
  const allMatches = [];
  Object.values(rounds).forEach((roundMatches) => {
    roundMatches.forEach((m) => {
      // Xóa các trường tạm dùng cho logic in-memory
      delete m.nextMatchRef;
      delete m.nextMatchSlot;
      delete m.matchIndex;
      allMatches.push(m);
    });
  });

  return allMatches;
}
