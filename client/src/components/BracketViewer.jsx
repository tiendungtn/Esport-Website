import { Link } from "react-router-dom";

/** Simple Single-Elimination Bracket Viewer */
export default function BracketViewer({ matches = [] }) {
  if (!matches.length)
    return (
      <p className="text-sm text-slate-400">
        Chưa có trận đấu nào trong bracket này.
      </p>
    );

  const roundsMap = new Map();
  matches.forEach((m) => {
    const r = m.round ?? 1;
    if (!roundsMap.has(r)) roundsMap.set(r, []);
    roundsMap.get(r).push(m);
  });

  const roundNumbers = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 py-4">
        {roundNumbers.map((rNum, idx) => (
          <div key={rNum} className="min-w-[260px]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Round {idx + 1}
            </div>
            <div className="space-y-3">
              {roundsMap.get(rNum).map((m) => (
                <div
                  key={m._id}
                  className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm"
                >
                  <MatchRow
                    name={m.teamA?.name}
                    score={m.scoreA}
                    isWinner={m.scoreA > m.scoreB}
                    teamId={m.teamA?._id}
                  />
                  <MatchRow
                    name={m.teamB?.name}
                    score={m.scoreB}
                    isWinner={m.scoreB > m.scoreA}
                    teamId={m.teamB?._id}
                  />
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                    {m.state}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchRow({ name, score, isWinner, teamId }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div
        className={`flex-1 truncate ${
          isWinner ? "font-semibold text-slate-50" : "text-slate-300"
        }`}
      >
        {teamId ? (
          <Link
            to={`/teams/${teamId}`}
            className="hover:text-sky-400 hover:underline"
          >
            {name || "TBD"}
          </Link>
        ) : (
          name || "TBD"
        )}
      </div>
      <div className="flex h-6 min-w-[28px] items-center justify-center rounded bg-slate-800 px-2 text-center text-xs text-slate-100">
        {score ?? 0}
      </div>
    </div>
  );
}
