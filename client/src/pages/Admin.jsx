import React, { useState } from "react";
import { Trophy, Users, Calendar, User } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import AdminTournaments from "./admin/AdminTournaments";
import AdminTeams from "./admin/AdminTeams";
import AdminPlayers from "./admin/AdminPlayers";
import AdminMatches from "./admin/AdminMatches";
import "../styles/pages/admin.css";

export default function Admin() {
  const { t } = useTranslation();
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("tournaments");

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs = [
    {
      id: "tournaments",
      label: t("TournamentsTab"),
      icon: Trophy,
      component: AdminTournaments,
    },
    { id: "teams", label: t("TeamsTab"), icon: Users, component: AdminTeams },
    {
      id: "players",
      label: t("PlayersTab"),
      icon: User,
      component: AdminPlayers,
    },
    {
      id: "matches",
      label: t("MatchesTab"),
      icon: Calendar,
      component: AdminMatches,
    },
  ];

  const ActiveComponent =
    tabs.find((t) => t.id === activeTab)?.component || AdminTournaments;

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-nav-item ${
                activeTab === tab.id
                  ? "admin-nav-item-active"
                  : "admin-nav-item-inactive"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <ActiveComponent />
      </div>
    </div>
  );
}
