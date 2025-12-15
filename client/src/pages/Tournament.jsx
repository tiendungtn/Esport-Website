import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  translateGameName,
  translateTournamentName,
} from "../lib/gameTranslations";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import BracketViewer from "../components/BracketViewer.jsx";
import RegistrationModal from "../components/RegistrationModal.jsx";
import "../styles/pages/tournament.css";

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
    <div className="tournament-container">
      <section className="tournament-header-section">
        <div className="tournament-header-content">
          <div>
            <p className="tournament-game-label">
              {translateGameName(tournament.game)}
            </p>
            <h1 className="tournament-title">
              {translateTournamentName(tournament.name)}
            </h1>
            <p className="tournament-description">
              {tournament.description || t("TournamentDescription")}
            </p>
            {/* Registration Time Display */}
            {(tournament.schedule?.regOpen ||
              tournament.schedule?.regClose) && (
              <div className="tournament-reg-info">
                {tournament.schedule?.regOpen && (
                  <p className="tournament-reg-item">
                    📅 <strong>{t("RegOpenLabel")}:</strong>{" "}
                    {new Date(tournament.schedule.regOpen).toLocaleString()}
                  </p>
                )}
                {tournament.schedule?.regClose && (
                  <p className="tournament-reg-item">
                    ⏰ <strong>{t("RegCloseLabel")}:</strong>{" "}
                    {new Date(tournament.schedule.regClose).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
          {tournament.status === "open" &&
            (tournament.schedule?.regClose &&
            new Date() > new Date(tournament.schedule.regClose) ? (
              <button
                disabled
                className="tournament-register-btn opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 border-gray-400 text-slate-100"
              >
                {t("RegistrationClosed")}
              </button>
            ) : (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="tournament-register-btn"
              >
                {t("RegisterToJoin")}
              </button>
            ))}
        </div>
      </section>

      {showRegisterModal && (
        <RegistrationModal
          tournamentId={id}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      <section className="tournament-bracket-section">
        <h2 className="tournament-bracket-title">{t("BracketSE")}</h2>
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
