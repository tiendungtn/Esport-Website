import React, { useState } from "react";
import { Link } from "react-router-dom";
import AlertModal from "./AlertModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import "../styles/components/registration-modal.css";

export default function RegistrationModal({ tournamentId, onClose }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [error, setError] = useState(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onClose: null, // Optional callback after alert closes
  });

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => (await api.get("/api/teams/mine")).data,
  });

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (alertState.onClose) {
      alertState.onClose();
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (teamId) => {
      return (
        await api.post(`/api/tournaments/${tournamentId}/registrations`, {
          teamId,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tournament", tournamentId]);
      setAlertState({
        isOpen: true,
        title: t("RegistrationSuccessTitle"),
        message: t("RegistrationSuccessMessage"),
        type: "success",
        onClose: () => onClose(), // Close the modal after alert confirms
      });
    },
    onError: (err) => {
      let errorMessage = err.response?.data?.message || t("RegistrationFailed");

      if (
        errorMessage === "Only the team captain can register for tournaments"
      ) {
        errorMessage = t("OnlyCaptainCanRegister");
      }
      // setError(errorMessage); // We can just use the AlertModal for the error now, or both.
      // Let's use AlertModal for better consistency as requested.
      setAlertState({
        isOpen: true,
        title: t("RegistrationErrorTitle"),
        message: errorMessage,
        type: "error",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    registerMutation.mutate(selectedTeam);
  };

  return (
    <div className="rm-overlay">
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="rm-content">
        <h2 className="rm-title">{t("RegisterTitle")}</h2>
        <p className="rm-description">{t("RegisterDescription")}</p>

        <form onSubmit={handleSubmit} className="rm-form">
          <div>
            <label className="rm-label">{t("SelectTeam")}</label>
            {isLoading ? (
              <div className="rm-loading" />
            ) : myTeams?.length > 0 ? (
              <div className="rm-team-list">
                {myTeams.map((team) => (
                  <label
                    key={team._id}
                    className={`rm-team-label ${
                      selectedTeam === team._id
                        ? "rm-team-label-selected"
                        : "rm-team-label-default"
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team._id}
                      checked={selectedTeam === team._id}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="hidden"
                    />
                    <div className="rm-team-logo-container">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="rm-team-logo"
                        />
                      ) : (
                        <div className="rm-team-initial">{team.name[0]}</div>
                      )}
                    </div>
                    <div className="rm-team-info">
                      <div className="rm-team-name">{team.name}</div>
                      <div className="rm-team-meta">
                        {t("MemberCount", { count: team.members?.length || 1 })}
                      </div>
                    </div>
                    {selectedTeam === team._id && (
                      <div className="rm-check-icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rm-empty-state">
                {t("NoTeamsYet")}{" "}
                <Link to="/teams/create" className="rm-create-link">
                  {t("CreateTeamNow")}
                </Link>
              </div>
            )}
          </div>

          <div className="rm-footer">
            <button type="button" onClick={onClose} className="rm-btn-cancel">
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={!selectedTeam || registerMutation.isPending}
              className="rm-btn-submit"
            >
              {registerMutation.isPending ? t("Processing") : t("RegisterNow")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
