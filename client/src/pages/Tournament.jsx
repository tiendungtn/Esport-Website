import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import BracketViewer from "../components/BracketViewer.jsx";
import RegistrationModal from "../components/RegistrationModal.jsx";

export default function Tournament() {
  const { t } = useTranslation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);

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

  React.useEffect(() => {
    if (!id) return;
    const channel = `tournament:${id}`;
    socket.emit("join", channel);

    const handleMatchUpdate = () => {
      queryClient.invalidateQueries(["matches", id]);
    };

    socket.on("match:state", handleMatchUpdate);
    socket.on("score:update", handleMatchUpdate);

    return () => {
      socket.off("match:state", handleMatchUpdate);
      socket.off("score:update", handleMatchUpdate);
    };
  }, [id, queryClient]);

  if (loadingTournament) {
    return <p className="text-sm text-slate-400">{t("LoadingTournament")}</p>;
  }
  if (errorTournament) {
    return <p className="text-sm text-red-400">{t("TournamentNotFound")}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-400">
              {tournament.game}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">
              {tournament.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {tournament.description || t("TournamentDescription")}
            </p>
          </div>
          {tournament.status === "open" && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400 hover:shadow-sky-500/40"
            >
              {t("RegisterToJoin")}
            </button>
          )}
        </div>
      </section>

      {showRegisterModal && (
        <RegistrationModal
          tournamentId={id}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t("BracketSE")}
        </h2>
        {loadingMatches && (
          <p className="text-sm text-slate-400">{t("LoadingMatches")}</p>
        )}
        {errorMatches && (
          <p className="text-sm text-red-400">{t("ErrorLoadingMatches")}</p>
        )}
        {!loadingMatches && !errorMatches && (
          <BracketViewer matches={matches || []} />
        )}
      </section>
    </div>
  );
}
