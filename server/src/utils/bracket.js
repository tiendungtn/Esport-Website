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
 * @returns {object[]} Mảng đối tượng trận đấu (chưa lưu).
 */
export function generateFullSEBracket(teamIds, tournamentId) {
  const padded = padToPowerOfTwo(teamIds);
  const n = padded.length; // Power of 2
  const totalRounds = Math.log2(n);

  // 1. Tạo cấu trúc các vòng đấu
  // rounds[r] là mảng các trận đấu của vòng r (index từ 1)
  const rounds = {};
  for (let r = 1; r <= totalRounds; r++) {
    rounds[r] = [];
    const matchCount = n / Math.pow(2, r);
    for (let i = 0; i < matchCount; i++) {
      rounds[r].push({
        tournamentId,
        round: r,
        bestOf: r === 1 ? 3 : 5,
        matchIndex: i, // internal index to help linking
        // Có thể tạo trước ID ở đây hoặc để caller/mongoose làm
        // Để liên kết, dùng tham chiếu đối tượng trong bộ nhớ đơn giản hơn
        // nhưng cần ID để tham chiếu DB.
        // Giả sử sẽ tạo ID trước khi lưu hoặc dùng tham chiếu tạm.
        // Tốt nhất là tạo ID giả hoặc logic index dự kiến.
      });
    }
  }

  // 2. Liên kết các vòng
  // Trận ở vòng r dẫn đến vòng r+1
  for (let r = 1; r < totalRounds; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    for (let i = 0; i < currentRound.length; i++) {
      const currentMatch = currentRound[i];
      // Parent in next round is index floor(i/2)
      const parentIndex = Math.floor(i / 2);
      const parentMatch = nextRound[parentIndex];

      // Xác định trận này dẫn vào slot Team A hay Team B của trận cha
      // Index chẵn (0, 2, 4...) -> Team A (slot A)
      // Index lẻ (1, 3, 5...) -> Team B (slot B)
      // Kiểm tra:
      // Vòng 1: Trận 0,1 vào Trận 0 (Vòng 2). 0->A, 1->B. Đúng.
      if (i % 2 === 0) {
        currentMatch.nextMatchSlot = "A"; // hỗ trợ logic
        // Chưa có ID nên chưa set được.
        // Gán tham chiếu đối tượng trước.
        currentMatch.nextMatchRef = parentMatch;
      } else {
        currentMatch.nextMatchSlot = "B";
        currentMatch.nextMatchRef = parentMatch;
      }
    }
  }

  // 3. Gán hạt giống cho Vòng 1
  // Dùng logic ghép cặp đơn giản của generateSERoundPairs: (0,15), (1,14)...
  // Logic này (0 vs 15) và (1 vs 14) -> Vòng sau gặp nhau (0 vs 1).
  // Hạt giống 1 và 2 gặp nhau ở Vòng 2 là không tốt cho xếp hạng chuẩn.
  // Nhưng xếp hạng chuẩn phức tạp. Hiện tại giữ logic ghép cặp hiện có
  // vì định nghĩa lại thuật toán xếp hạt giống nằm ngoài phạm vi/rủi ro.
  // Chỉ cần đảm bảo nhánh đấu diễn ra.
  // Map các cặp từ generateSERoundPairs vào các trận Vòng 1 (0..k)

  const round1Pairs = generateSERoundPairs(padded); // Mảng của [p1, p2]
  // Phân phối các cặp này vào trận đấu Vòng 1.
  // Giả sử trận Vòng 1 [0, 1, 2...] tương ứng với cặp [0, 1, 2...].

  round1Pairs.forEach((pair, idx) => {
    const match = rounds[1][idx];
    if (match) {
      match.teamA = pair[0];
      match.teamB = pair[1];
    }
  });

  // Làm phẳng cấu trúc
  const allMatches = [];
  Object.values(rounds).forEach((roundMatches) => {
    allMatches.push(...roundMatches);
  });

  return allMatches;
}
