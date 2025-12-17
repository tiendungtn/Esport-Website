import mongoose from "mongoose";

/** Tiện ích tạo nhánh đấu */

/**
 * Kiểm tra xem n có phải là lũy thừa của 2 không
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Tìm lũy thừa 2 nhỏ nhất >= n
 */
function nextPowerOfTwo(n) {
  if (n <= 1) return 2; // Bracket cần ít nhất 2 đội
  if (isPowerOfTwo(n)) return n; // Đã là lũy thừa 2, không cần thay đổi
  
  // Tìm lũy thừa 2 tiếp theo bằng bitwise
  let power = 1;
  while (power < n) {
    power <<= 1;
  }
  return power;
}

export function padToPowerOfTwo(list) {
  const size = nextPowerOfTwo(list.length);
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
        bestOf: r === 1 ? 3 : 5, // Vòng 1 BO3, các vòng khác BO5
        matchIndex: i, // Dùng để truy xuất
        // Khởi tạo các trường
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

      // Chỉ số chẵn -> Slot A, Lẻ -> Slot B
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
      // Bye xảy ra khi 1 trong 2 đội là null
      const hasTeamA = !!match.teamA;
      const hasTeamB = !!match.teamB;

      if (hasTeamA && !hasTeamB) {
        // Đội A thắng
        match.state = "final"; // Đánh dấu hoàn thành
        match.scoreA = 2; // Giả định thắng tuyệt đối
        match.scoreB = 0;
        // Đưa A vào vòng sau
        if (match.nextMatchRef) {
          if (match.nextMatchSlot === "A")
            match.nextMatchRef.teamA = match.teamA;
          else match.nextMatchRef.teamB = match.teamA;
        }
      } else if (!hasTeamA && hasTeamB) {
        // Đội B thắng
        match.state = "final";
        match.scoreA = 0;
        match.scoreB = 2;
        // Đưa B vào vòng sau
        if (match.nextMatchRef) {
          if (match.nextMatchSlot === "A")
            match.nextMatchRef.teamA = match.teamB;
          else match.nextMatchRef.teamB = match.teamB;
        }
      }
    }
  });

  // 4. Dọn dẹp và Làm phẳng
  const allMatches = [];
  Object.values(rounds).forEach((roundMatches) => {
    roundMatches.forEach((m) => {
      // Xóa các trường tạm dùng cho logic trong bộ nhớ
      delete m.nextMatchRef;
      delete m.nextMatchSlot;
      delete m.matchIndex;
      allMatches.push(m);
    });
  });

  return allMatches;
}

/**
 * Sinh lịch thi đấu cho bracket
 * @param {object[]} matches - Mảng trận đấu đã tạo
 * @param {Date|string} startDate - Ngày bắt đầu giải
 * @param {object} options - Tùy chọn
 * @returns {object[]} Mảng trận đấu có scheduledAt
 */
export function generateMatchSchedule(matches, startDate, options = {}) {
  const {
    matchDurationMinutes = 90,      // Thời gian ước tính mỗi trận
    breakBetweenMinutes = 30,       // Nghỉ giữa các trận
    matchesPerDay = 4,              // Số trận tối đa mỗi ngày
    startHour = 14,                 // Giờ bắt đầu (14:00)
    endHour = 22,                   // Giờ kết thúc (22:00)
  } = options;

  // Nhóm theo round
  const roundGroups = {};
  matches.forEach(m => {
    if (!roundGroups[m.round]) roundGroups[m.round] = [];
    roundGroups[m.round].push(m);
  });

  const baseDate = new Date(startDate);
  let currentDate = new Date(baseDate);
  currentDate.setHours(startHour, 0, 0, 0);

  const totalMatchTime = matchDurationMinutes + breakBetweenMinutes;

  // Xử lý từng round theo thứ tự
  const sortedRounds = Object.keys(roundGroups).map(Number).sort((a, b) => a - b);

  sortedRounds.forEach((roundNum, roundIdx) => {
    const roundMatches = roundGroups[roundNum];
    
    // Vòng sau = ngày sau
    if (roundIdx > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(startHour, 0, 0, 0);
    }

    let matchesScheduledToday = 0;

    roundMatches.forEach(match => {
      // Bỏ qua trận đã bye (state = final và không có cả 2 đội)
      if (match.state === 'final' && (!match.teamA || !match.teamB)) {
        return;
      }

      // Kiểm tra nếu vượt quá số trận/ngày hoặc quá giờ
      if (matchesScheduledToday >= matchesPerDay || currentDate.getHours() >= endHour) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(startHour, 0, 0, 0);
        matchesScheduledToday = 0;
      }

      match.scheduledAt = new Date(currentDate);
      currentDate.setMinutes(currentDate.getMinutes() + totalMatchTime);
      matchesScheduledToday++;
    });
  });

  return matches;
}
