import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  translateGameName,
  translateTournamentName,
} from "../lib/gameTranslations";
import "../styles/pages/home.css";

export default function Home() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  return (
    <div className="home-container">
      <section className="home-hero-section">
        <p className="home-hero-badge">{t("HUMG_Esports")}</p>
        <h1 className="home-hero-title">{t("HeroTitle")}</h1>
        <p className="home-hero-subtitle">{t("HeroSubtitle")}</p>
        <div className="home-hero-actions">
          {isAdmin && (
            <Link to="/admin" className="home-create-btn">
              {t("CreateTournamentBtn")}
            </Link>
          )}
          <a href="#tournaments" className="home-view-btn">
            {t("ViewOpenTournaments")}
          </a>
        </div>
      </section>

      <section id="tournaments" className="home-tournaments-section">
        <div className="home-section-header">
          <h2 className="home-section-title">{t("FeaturedTournaments")}</h2>
        </div>

        {isLoading && <p className="home-loading">{t("LoadingTournaments")}</p>}
        {error && <p className="home-error">{t("ErrorLoadingTournaments")}</p>}

        {!isLoading && !error && data?.length > 0 && (
          <div className="home-grid">
            {data.map((tournament) => {
              const theme = getGameTheme(tournament.game);
              return (
                <Link
                  key={tournament._id}
                  to={`/t/${tournament.slug || tournament._id}`}
                  className={`group tournament-card ${theme.from} ${theme.to}`}
                >
                  {/* Background Image/Banner */}
                  <div className="tournament-card-bg">
                    <img
                      src={getGameImage(tournament.game)}
                      alt={tournament.game}
                      className="tournament-card-img"
                    />
                  </div>

                  {/* Content */}
                  <div className="tournament-card-content">
                    <div className="tournament-card-header">
                      <div className="tournament-card-title-row">
                        <h3 className="tournament-card-title">
                          {translateTournamentName(tournament.name)}
                        </h3>
                        <span
                          className={`tournament-status-badge ${badgeClassForStatus(
                            tournament.status
                          )}`}
                        >
                          {labelForStatus(tournament.status, t)}
                        </span>
                      </div>
                    </div>

                    <div className="tournament-card-footer">
                      <p className="tournament-game-name">
                        {translateGameName(tournament.game)}
                      </p>
                      <p className="tournament-max-teams">
                        {t("MaxTeams", { count: tournament.maxTeams })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <p className="home-loading">{t("NoTournaments")}</p>
        )}
      </section>
    </div>
  );
}

function labelForStatus(status, t) {
  switch (status) {
    case "open":
      return t("StatusOpen");
    case "ongoing":
      return t("StatusOngoing");
    case "finished":
      return t("StatusFinished");
    default:
      return t("StatusDraft");
  }
}

function badgeClassForStatus(status) {
  switch (status) {
    case "open":
      return "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-800";
    case "ongoing":
      return "bg-sky-500/20 text-sky-100 border border-sky-500/30";
    case "finished":
      return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
    default:
      return "bg-white/10 text-white border border-white/20";
  }
}

import cs2Banner from "../img/CS2-banner.png";
import valorantBanner from "../img/Valorant-banner.png";
import aovBanner from "../img/Lien-quan-banner.png";
import wildRiftBanner from "../img/Toc-chien-banner.png";
import lolBanner from "../img/Lien-minh-huyen-thoai-banner.png";

function getGameImage(game) {
  const map = {
    CS2: cs2Banner,
    VALORANT: valorantBanner,
    Valorant: valorantBanner,
    "Arena of Valor": aovBanner,
    "Liên Quân": aovBanner,
    "Wild Rift": wildRiftBanner,
    "Tốc Chiến": wildRiftBanner,
    "League of Legends": lolBanner,
    "Liên Minh Huyền Thoại": lolBanner,
    "FC Online": "https://placehold.co/600x400?text=FC+Online",
  };
  return map[game] || "https://placehold.co/600x400?text=Esports";
}

function getGameTheme(game) {
  const themes = {
    CS2: { from: "from-slate-900", to: "to-blue-900" },
    "CS:GO": { from: "from-slate-900", to: "to-blue-900" },
    VALORANT: { from: "from-orange-600", to: "to-red-600" },
    Valorant: { from: "from-orange-600", to: "to-red-600" },
    "League of Legends": { from: "from-yellow-700", to: "to-yellow-900" },
    "Liên Minh Huyền Thoại": { from: "from-yellow-700", to: "to-yellow-900" },
    "Dota 2": { from: "from-red-900", to: "to-slate-900" },
    PUBG: { from: "from-amber-500", to: "to-yellow-600" },
    "Mobile Legends": { from: "from-blue-600", to: "to-indigo-700" },
    "Arena of Valor": { from: "from-teal-600", to: "to-cyan-700" },
    "Liên Quân": { from: "from-teal-600", to: "to-cyan-700" },
    "Free Fire": { from: "from-orange-500", to: "to-amber-600" },
    TFT: { from: "from-sky-600", to: "to-blue-700" },
    "FC Online": { from: "from-emerald-600", to: "to-green-700" },
    "Wild Rift": { from: "from-purple-700", to: "to-indigo-900" },
    "Tốc Chiến": { from: "from-purple-700", to: "to-indigo-900" },
  };
  return themes[game] || { from: "from-slate-800", to: "to-slate-900" };
}
