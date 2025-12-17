import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Clock, LogIn, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { translateTournamentName } from "../lib/gameTranslations";
import { socket } from "../lib/socket";
import "../styles/components/notification.css";

export default function NotificationBell() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch user's teams to join socket rooms
  const { data: myTeams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const res = await api.get("/api/teams/mine");
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch upcoming matches
  const {
    data: upcomingMatches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-upcoming-matches"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/upcoming-matches");
      return res.data;
    },
    refetchInterval: 60000,
    retry: false,
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  // Socket.io integration to listen for team updates
  useEffect(() => {
    if (!isAuthenticated || !myTeams) return;

    // Join team rooms
    myTeams.forEach((team) => {
      // Assuming socket.emit('join', roomName) is handled by server
      socket.emit("join", `team:${team._id}`);
    });

    const handleUpdate = () => {
      // Invalidate query to refetch latest data
      queryClient.invalidateQueries(["my-upcoming-matches"]);
    };

    // Listen for events emitted to team rooms
    socket.on("match:schedule", handleUpdate);
    socket.on("match:state", handleUpdate);
    socket.on("score:update", handleUpdate);

    return () => {
      // Cleanup listeners
      socket.off("match:schedule", handleUpdate);
      socket.off("match:state", handleUpdate);
      socket.off("score:update", handleUpdate);
      
      // Optional: Leave rooms if supported by server/client logic, 
      // but usually socket disconnect handles it or it's fine to stay joined.
    };
  }, [isAuthenticated, myTeams, queryClient]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate time remaining (helper function)
  const getTimeRemaining = (scheduledAt) => {
    const now = new Date();
    const matchTime = new Date(scheduledAt);
    const diffMs = matchTime - now;
    
    if (diffMs < 0) return { text: t("MatchStarted"), urgency: "imminent" };
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return { 
        text: `${diffMins} ${t("InMinutes")}`,
        urgency: diffMins < 15 ? "imminent" : "soon"
      };
    }
    
    if (diffHours < 24) {
      return { 
        text: `${diffHours} ${t("InHours")}`,
        urgency: diffHours < 2 ? "soon" : "normal"
      };
    }
    
    return { 
      text: `${diffDays} ${t("InDays")}`,
      urgency: "normal"
    };
  };

  const matchCount = upcomingMatches?.length || 0;

  const handleLogin = () => {
    setIsOpen(false);
    navigate("/login", {
      state: { backgroundLocation: location },
    });
  };

  return (
    <div ref={containerRef} className="notification-bell-container">
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t("Notifications")}
      >
        <Bell />
        {matchCount > 0 && (
          <span className="notification-badge">
            {matchCount > 9 ? "9+" : matchCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <Trophy />
            <span>{t("UpcomingMatches")}</span>
          </div>

          <div className="notification-dropdown-content">
            {!isAuthenticated ? (
               <div className="notification-empty">
                <LogIn size={48} style={{ marginBottom: "12px", opacity: 0.5 }} />
                <p className="notification-empty-text" style={{ marginBottom: "16px" }}>
                  {t("LoginToViewNotifications")}
                </p>
                <button 
                  onClick={handleLogin}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  {t("SignIn")}
                </button>
              </div>
            ) : isLoading ? (
              <div className="notification-loading">
                <div className="notification-spinner"></div>
              </div>
            ) : error ? (
              <div className="notification-empty">
                <Bell />
                <p className="notification-empty-text">{t("GenericError")}</p>
              </div>
            ) : matchCount === 0 ? (
              <div className="notification-empty">
                <Calendar />
                <p className="notification-empty-text">{t("NoUpcomingMatches")}</p>
              </div>
            ) : (
              upcomingMatches.map((match) => {
                const timeRemaining = getTimeRemaining(match.scheduledAt);
                
                return (
                  <Link
                    key={match.matchId}
                    to={`/t/${match.tournamentId}`}
                    className="notification-match-card"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="notification-tournament-name">
                      <Trophy />
                      {translateTournamentName(match.tournamentName)}
                    </div>
                    
                    <div className="notification-teams-row">
                      <div className="notification-team">
                        {match.myTeam?.logoUrl ? (
                          <img
                            src={match.myTeam.logoUrl}
                            alt={match.myTeam.name}
                            className="notification-team-logo"
                          />
                        ) : (
                          <div className="notification-team-placeholder">
                            {match.myTeam?.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <span className="notification-team-name">
                          {match.myTeam?.name || t("TBD")}
                        </span>
                      </div>
                      
                      <span className="notification-vs">VS</span>
                      
                      <div className="notification-team opponent">
                        <span className="notification-team-name">
                          {match.opponent?.name || t("TBD")}
                        </span>
                        {match.opponent?.logoUrl ? (
                          <img
                            src={match.opponent.logoUrl}
                            alt={match.opponent.name}
                            className="notification-team-logo"
                          />
                        ) : (
                          <div className="notification-team-placeholder">
                            {match.opponent?.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="notification-time-row">
                      <div className="notification-schedule">
                        <Clock />
                        <span>
                          {new Date(match.scheduledAt).toLocaleDateString()} •{" "}
                          {new Date(match.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      
                      <span className={`notification-countdown ${timeRemaining.urgency}`}>
                        {timeRemaining.text}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
