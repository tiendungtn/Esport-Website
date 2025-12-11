import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import "../../styles/pages/admin.css";

// Helper component for status badges
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };

  const labels = {
    pending: t("StatusPending"),
    approved: t("StatusApproved"),
    rejected: t("StatusRejected"),
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${
        styles[status] || styles.pending
      }`}
    >
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
      alert(t("FailedUpdateStatus"));
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "all") return true;
    return reg.status === filter;
  });

  return (
    <div className="atem-overlay">
      <div className="atem-content-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="atem-title mb-0">{t("RegistrationListTitle")}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="admin-filters mb-4 flex gap-2">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">
            {t("LoadRegistrations")}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-700">
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-gray-900 z-10 shadow-sm border-b border-gray-700 text-gray-400 text-sm">
                  <tr>
                    <th className="p-3">{t("TeamName")}</th>
                    <th className="p-3">{t("Members")}</th>
                    <th className="p-3">{t("Date")}</th>
                    <th className="p-3">{t("TableStatus")}</th>
                    <th className="p-3">{t("TableActions")}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-8 text-gray-500"
                      >
                        {t("NoRegistrationsFilter")}
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr
                        key={reg._id}
                        className="border-b border-gray-800 hover:bg-gray-800/30"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                              {reg.teamId?.logoUrl ? (
                                <img
                                  src={reg.teamId.logoUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">
                                  {reg.teamId?.name
                                    ?.substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate max-w-[150px]">
                                {reg.teamId?.name || t("UnknownTeam")}
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-[150px]">
                                {reg.teamId?.tag}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-gray-300">
                          {reg.teamId?.members?.length || 0}
                        </td>
                        <td className="p-3 text-gray-400 text-xs">
                          {new Date(reg.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={reg.status} />
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {reg.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(reg._id, "approved")
                                  }
                                  className="p-1 rounded bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900/50 transition-colors"
                                  title={t("Approve")}
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleStatusUpdate(reg._id, "rejected")
                                  }
                                  className="p-1 rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 transition-colors"
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
  );
}
