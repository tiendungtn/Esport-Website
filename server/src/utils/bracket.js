/** Utilities to generate brackets */

export function padToPowerOfTwo(list) {
  const size = 1 << Math.ceil(Math.log2(Math.max(list.length, 1)));
  return list.concat(Array(Math.max(0, size - list.length)).fill(null));
}

export function seedingByRegistration(regs) {
  // regs: [{teamId, seed?}] -> returns array of teamIds sorted by seed asc or original order
  return [...regs].sort((a,b) => (a.seed ?? Infinity) - (b.seed ?? Infinity)).map(r => r.teamId);
}

export function generateSERoundPairs(teamIds) {
  const padded = padToPowerOfTwo(teamIds);
  const n = padded.length;
  const pairs = [];
  for (let i = 0; i < n/2; i++) pairs.push([padded[i], padded[n-1-i]]);
  return pairs;
}
