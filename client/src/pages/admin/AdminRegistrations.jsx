import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { api, seedTournament } from "../../lib/api";
import AlertModal from "../../components/AlertModal";
import "../../styles/pages/admin-registrations.css";

// Helper component for status badges
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const styles = {
    pending: "atem-badge-pending",
    approved: "atem-badge-approved",
    rejected: "atem-badge-rejected",
  };

  const labels = {
    pending: t("StatusPending"),
    approved: t("StatusApproved"),
    rejected: t("StatusRejected"),
  };

  return (
    <span className={`atem-badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AdminRegistrations({ tournamentId, onClose }) {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved', 'rejected'
  const [seeds, setSeeds] = useState({}); // { teamId: seedValue }
  const [savingSeeds, setSavingSeeds] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info", // success, error, info
  });

  // Fetch registrations when tournamentId changes
  useEffect(() => {
    if (!tournamentId) return;

    const fetchRegistrations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(
          `/api/tournaments/${tournamentId}/registrations`
        );
        setRegistrations(res.data);
        // Initialize seeds
        const initialSeeds = {};
        res.data.forEach((r) => {
          if (r.seed) initialSeeds[r.teamId._id] = r.seed;
        });
        setSeeds(initialSeeds);
      } catch (err) {
        console.error("Failed to fetch registrations", err);
        setError(t("FailedLoadRegistrations"));
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [tournamentId]);

  const handleStatusUpdate = async (regId, newStatus) => {
    try {
      const res = await api.put(
        `/api/tournaments/${tournamentId}/registrations/${regId}`,
        {
          status: newStatus,
        }
      );

      // Update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg._id === regId ? { ...reg, status: newStatus } : reg
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
      // alert(t("FailedUpdateStatus")); // Replaced with modal
      setAlertState({
        isOpen: true,
        title: t("Error"),
        message: t("FailedUpdateStatus"),
        type: "error",
      });
    }
  };

  const handleSeedChange = (teamId, value) => {
    setSeeds((prev) => ({
      ...prev,
      [teamId]: value,
    }));
  };

  const handleSaveSeeding = async () => {
    setSavingSeeds(true);
    try {
      // Build payload
      const payload = Object.entries(seeds)
        .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        .map(([teamId, seed]) => ({
          teamId,
          seed: parseInt(seed),
        }));

      await seedTournament(tournamentId, payload);
      // alert(t("SeedingSaved") || "Seeding saved successfully!");
      setAlertState({
        isOpen: true,
        type: "success",
        title: t("Success"),
        message: t("SeedingSaved"),
      });
    } catch (err) {
      console.error("Failed to save seeding", err);
      // alert(err.response?.data?.message || t("FailedSaveSeeding"));
      setAlertState({
        isOpen: true,
        type: "error",
        title: t("Error"),
        message: err.response?.data?.message || t("FailedSaveSeeding"),
      });
    } finally {
      setSavingSeeds(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.status === filter;
  });

  return (
    <>
      <div className="atem-overlay">
        <div className="atem-content-lg">
          <div className="atem-header-row">
            <h3 className="atem-title">{t("RegistrationListTitle")}</h3>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={handleSaveSeeding}
                disabled={savingSeeds}
                className="atem-btn-save-seeds"
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  opacity: savingSeeds ? 0.7 : 1,
                }}
              >
                {savingSeeds ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {t("SaveSeeding")}
              </button>
              <button onClick={onClose} className="atem-close-btn">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="atem-filters">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`atem-filter-btn ${
                  filter === f
                    ? "atem-filter-btn-active"
                    : "atem-filter-btn-inactive"
                }`}
              >
                {f === "all" && t("StatusAll")}
                {f === "pending" && t("StatusPending")}
                {f === "approved" && t("StatusApproved")}
                {f === "rejected" && t("StatusRejected")}
              </button>
            ))}
          </div>

          {error && (
            <div className="atem-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="atem-loading">{t("LoadRegistrations")}</div>
          ) : (
            <div className="atem-table-container">
              <div className="atem-table-scroll custom-scrollbar">
                <table className="atem-table">
                  <thead className="atem-thead">
                    <tr>
                      <th className="atem-th">{t("TeamName")}</th>
                      <th className="atem-th">{t("Members")}</th>
                      <th className="atem-th">{t("Date")}</th>
                      <th className="atem-th">{t("Seed")}</th>
                      <th className="atem-th">{t("TableStatus")}</th>
                      <th className="atem-th">{t("TableActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="atem-tbody">
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="atem-empty-row">
                          {t("NoRegistrationsFilter")}
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((reg) => (
                        <tr key={reg._id} className="atem-row">
                          <td className="atem-td">
                            <div className="atem-team-info">
                              <div className="atem-team-logo-wrapper">
                                {reg.teamId?.logoUrl ? (
                                  <img
                                    src={reg.teamId.logoUrl}
                                    alt=""
                                    className="atem-team-logo"
                                  />
                                ) : (
                                  <span className="atem-team-initials">
                                    {reg.teamId?.name
                                      ?.substring(0, 2)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="atem-team-details">
                                <div className="atem-team-name">
                                  {reg.teamId?.name || t("UnknownTeam")}
                                </div>
                                <div className="atem-team-tag">
                                  {reg.teamId?.tag}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="atem-td-count">
                            {reg.teamId?.members?.length || 0}
                          </td>
                          <td className="atem-td-date">
                            {new Date(reg.createdAt).toLocaleDateString()}
                          </td>
                          <td className="atem-td">
                            <input
                              type="number"
                              min="1"
                              className="atem-seed-input"
                              value={seeds[reg.teamId._id] || ""}
                              onChange={(e) =>
                                handleSeedChange(reg.teamId._id, e.target.value)
                              }
                              style={{
                                width: "60px",
                                padding: "4px",
                                background: "#1e293b",
                                color: "white",
                                border: "1px solid #475569",
                                borderRadius: "4px",
                              }}
                            />
                          </td>
                          <td className="atem-td">
                            <StatusBadge status={reg.status} />
                          </td>
                          <td className="atem-td">
                            <div className="atem-actions">
                              {reg.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(reg._id, "approved")
                                    }
                                    className="atem-btn-approve"
                                    title={t("Approve")}
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(reg._id, "rejected")
                                    }
                                    className="atem-btn-reject"
                                    title={t("Reject")}
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </>
  );
}
