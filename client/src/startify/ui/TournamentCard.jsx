import React from "react";
import { Link } from "react-router-dom";
import { Users, Trophy } from "lucide-react";

export default function TournamentCard({ data }) {
  const statusColor =
    data.status === "live"
      ? "text-green-400"
      : data.status === "upcoming"
      ? "text-yellow-300"
      : "text-white/50";
  return (
    <Link
      to={`/tournament/${data.slug}`}
      className="card overflow-hidden block hover:translate-y-[-2px] hover:shadow-lg transition"
    >
      <div className="aspect-[16/9] relative">
        {data.image ? (
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-500/30 to-cyan-400/20" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className={statusColor}>{data.status.toUpperCase()}</span>
          <span>
            {data.game} • {data.region}
          </span>
        </div>
        <h3 className="mt-2 font-semibold">{data.title}</h3>
        <div className="flex items-center gap-4 text-sm text-white/70 mt-2">
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {data.players}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            {data.prize}
          </span>
          <span>{data.date}</span>
        </div>
      </div>
    </Link>
  );
}
