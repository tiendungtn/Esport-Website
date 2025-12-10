import { Link } from "react-router-dom";
import "../styles/components/bracket-viewer.css";

/** Hiển thị Bracket Single-Elimination đơn giản */
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
    <div className="bv-container">
      <div className="bv-rounds-container">
        {roundNumbers.map((rNum, idx) => (
          <div key={rNum} className="bv-round-column">
            <div className="bv-round-header">Round {idx + 1}</div>
            <div className="bv-match-list">
              {roundsMap.get(rNum).map((m) => (
                <div key={m._id} className="bv-match-card">
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
                  <div className="bv-match-state">{m.state}</div>
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
    <div className="bv-row">
      <div
        className={`bv-team-name ${
          isWinner ? "font-semibold text-slate-50" : "text-slate-300"
        }`}
      >
        {teamId ? (
          <Link to={`/teams/${teamId}`} className="bv-team-link">
            {name || "TBD"}
          </Link>
        ) : (
          name || "TBD"
        )}
      </div>
      <div className="bv-score-box">{score ?? 0}</div>
    </div>
  );
}
