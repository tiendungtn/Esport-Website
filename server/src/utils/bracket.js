/** Utilities to generate brackets */

export function padToPowerOfTwo(list) {
  const size = 1 << Math.ceil(Math.log2(Math.max(list.length, 1)));
  return list.concat(Array(Math.max(0, size - list.length)).fill(null));
}

export function seedingByRegistration(regs) {
  // regs: [{teamId, seed?}] -> returns array of teamIds sorted by seed asc or original order
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
 * Generates a full Single Elimination bracket structure.
 * @param {string[]} teamIds - Array of team IDs (will be padded).
 * @param {string} tournamentId - The tournament ID.
 * @returns {object[]} Array of match objects (not yet saved).
 */
export function generateFullSEBracket(teamIds, tournamentId) {
  const padded = padToPowerOfTwo(teamIds);
  const n = padded.length; // Power of 2
  const totalRounds = Math.log2(n);

  // 1. Generate rounds structure
  // rounds[r] will be an array of match objects for round r (1-indexed)
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
        // We can pre-generate IDs here if we want, or let the caller/mongoose do it
        // For linking, simpler to have objects reference each other in memory
        // but we need IDs for the DB references.
        // Let's assume we'll generate IDs before saving, or use temporary references.
        // Actually, best to generate dummy IDs or expected index logic.
      });
    }
  }

  // 2. Link rounds
  // Round r matches feed into Round r+1
  for (let r = 1; r < totalRounds; r++) {
    const currentRound = rounds[r];
    const nextRound = rounds[r + 1];

    for (let i = 0; i < currentRound.length; i++) {
      const currentMatch = currentRound[i];
      // Parent in next round is index floor(i/2)
      const parentIndex = Math.floor(i / 2);
      const parentMatch = nextRound[parentIndex];

      // Determine if this match feeds into Team A or Team B slot of parent
      // Even index (0, 2, 4...) -> Team A (slot A)
      // Odd index (1, 3, 5...) -> Team B (slot B)
      // BUT verification:
      // Round 1: Matches 0,1 feed Match 0 (R2). 0->A, 1->B. Correct.
      if (i % 2 === 0) {
        currentMatch.nextMatchSlot = "A"; // logic helper
        // We can't set ID yet if we don't have it.
        // We will assign object references first.
        currentMatch.nextMatchRef = parentMatch;
      } else {
        currentMatch.nextMatchSlot = "B";
        currentMatch.nextMatchRef = parentMatch;
      }
    }
  }

  // 3. Assign seeds to Round 1
  // We use standard seeding: Match 0: 1 vs N, Match 1: 2 vs N-1 ??
  // No, generateSERoundPairs does: 0 vs N-1, 1 vs N-2 ... (Indices)
  // Let's reuse generateSERoundPairs logic for the pairing
  // The 'pairs' function returns [ [id1, id2], [id3, id4] ... ]
  // These correspond to Round 1 matches in order.

  // WAIT: generateSERoundPairs logic:
  // pairs[i] = [ padded[i], padded[n-1-i] ]
  // This is generic pairing. Is it "standard" bracket ordering?
  // Standard: 1 vs 16, 8 vs 9, 5 vs 12, 4 vs 13... (for 16 teams)
  // This simple "fold" logic: (0,15), (1,14)... puts 1 vs 16 and 2 vs 15.
  // But usually 1 and 2 should meet in Final.
  // With simple fold (0,15) and (1,14) -> Next round they meet?
  // (0,15) -> Winner 0. (1,14) -> Winner 1.
  // Next gen: Match 0 (from 0,15 and 1,14) -> 0 vs 1.
  // So 1 and 2 meet in Round 2! That's bad for seeding.
  // Standard seeding is complex. For now, let's STICK to the existing pairing logic
  // because redefining seeding algorithm is out of scope / risky.
  // We just want to make sure the bracket progresses.
  // We will map the pairs returned by generateSERoundPairs to Round 1 matches 0..k

  const round1Pairs = generateSERoundPairs(padded); // Array of [p1, p2]
  // We need to distribute these pairs into Round 1 matches such that seeds are distributed?
  // Given existing code just pushes to array, let's Assume Round 1 matches [0, 1, 2...]
  // correspond to pairs [0, 1, 2...].

  round1Pairs.forEach((pair, idx) => {
    const match = rounds[1][idx];
    if (match) {
      match.teamA = pair[0];
      match.teamB = pair[1];
    }
  });

  // Flatten structure
  const allMatches = [];
  Object.values(rounds).forEach((roundMatches) => {
    allMatches.push(...roundMatches);
  });

  return allMatches;
}
