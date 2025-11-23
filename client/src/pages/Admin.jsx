import React, { useState } from "react";
import { Trophy, Users, Calendar, User } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import AdminTournaments from "./admin/AdminTournaments";
import AdminTeams from "./admin/AdminTeams";
import AdminPlayers from "./admin/AdminPlayers";
import AdminMatches from "./admin/AdminMatches";

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
    <div className="flex min-h-[calc(100vh-100px)] gap-6">
      {/* Sidebar */}
      <div className="w-64 shrink-0 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-sky-500/10 text-sky-500"
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/50 p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
