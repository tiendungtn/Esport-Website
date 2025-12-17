import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import BracketViewer from "../components/BracketViewer.jsx";
import RegistrationModal from "../components/RegistrationModal.jsx";
import { api } from "../lib/api";
import {
    translateGameName,
    translateTournamentName,
} from "../lib/gameTranslations";
import { socket } from "../lib/socket";
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

      {/* Match Schedule Section */}
      {!loadingMatches && !errorMatches && matches && matches.length > 0 && (
        <MatchScheduleSection matches={matches} t={t} />
      )}
    </div>
  );
}

// Component hiển thị lịch thi đấu chi tiết theo Round
function MatchScheduleSection({ matches, t }) {
  // Nhóm matches theo round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  // Lọc chỉ các trận có lịch
  const scheduledMatches = matches.filter(m => m.scheduledAt);

  if (scheduledMatches.length === 0) return null;

  const sortedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <section className="match-schedule-section">
      <h2 className="match-schedule-title">{t("MatchSchedule")}</h2>
      <div className="match-schedule-rounds">
        {sortedRounds.map(round => {
          const roundMatches = matchesByRound[round].filter(m => m.scheduledAt);
          if (roundMatches.length === 0) return null;
          
          return (
            <div key={round} className="match-schedule-round">
              <h3 className="round-title">{t("RoundN", { count: round })}</h3>
              <div className="round-matches">
                {roundMatches.map(match => (
                  <div key={match._id} className="schedule-match-card">
                    <div className="match-teams">
                      <span className="team-name">{match.teamA?.name || t("TBD")}</span>
                      <span className="vs-label">vs</span>
                      <span className="team-name">{match.teamB?.name || t("TBD")}</span>
                    </div>
                    <div className="match-time">
                      📅 {new Date(match.scheduledAt).toLocaleDateString()}
                      <span className="time-separator">•</span>
                      ⏰ {new Date(match.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className={`match-status-badge status-${match.state}`}>
                      {t(`MatchStatus_${match.state}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
