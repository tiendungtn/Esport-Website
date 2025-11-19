import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import BracketViewer from "../components/BracketViewer.jsx";

export default function Tournament() {
  const { id } = useParams();

  const {
    data: tournament,
    isLoading: loadingTournament,
    error: errorTournament,
  } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => (await api.get(`/api/tournaments/${id}`)).data,
    enabled: !!id,
  });

  const {
    data: matches,
    isLoading: loadingMatches,
    error: errorMatches,
  } = useQuery({
    queryKey: ["matches", id],
    queryFn: async () => (await api.get(`/api/tournaments/${id}/matches`)).data,
    enabled: !!id,
  });

  if (loadingTournament) {
    return <p className="text-sm text-slate-400">Đang tải giải đấu...</p>;
  }
  if (errorTournament) {
    return <p className="text-sm text-red-400">Không tìm thấy giải đấu này.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-400">
          {tournament.game}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
          {tournament.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          {tournament.description ||
            "Giải đấu eSports được quản lý bởi hệ thống đồ án tốt nghiệp."}
        </p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Bracket Single Elimination
        </h2>
        {loadingMatches && (
          <p className="text-sm text-slate-400">Đang tải các trận đấu...</p>
        )}
        {errorMatches && (
          <p className="text-sm text-red-400">
            Không tải được danh sách trận đấu.
          </p>
        )}
        {!loadingMatches && !errorMatches && (
          <BracketViewer matches={matches || []} />
        )}
      </section>
    </div>
  );
}
