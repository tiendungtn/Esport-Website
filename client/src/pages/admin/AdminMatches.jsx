import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  Edit,
  CheckCircle,
  Upload,
  Link as LinkIcon,
  X,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/pages/admin-matches.css";

export default function AdminMatches() {
  const { t } = useTranslation();
  const [selectedTournament, setSelectedTournament] = useState("");
  const [editingMatch, setEditingMatch] = useState(null);
  const [confirmReject, setConfirmReject] = useState({
    isOpen: false,
    matchId: null,
    matchName: "",
  });

  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", selectedTournament],
    queryFn: async () => {
      if (!selectedTournament) return [];
      return (await api.get(`/api/tournaments/${selectedTournament}/matches`))
        .data;
    },
    enabled: !!selectedTournament,
  });

  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState(null);

  const rejectMutation = useMutation({
    mutationFn: async (id) => (await api.put(`/api/matches/${id}/reject`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setConfirmReject({ isOpen: false, matchId: null, matchName: "" });
      setRejectId(null);
    },
    onError: (error) => {
      alert(t("FailedToRejectMatch"));
    },
  });

  const handleReject = (match) => {
    setConfirmReject({
      isOpen: true,
      matchId: match._id,
      matchName: `${match.teamA?.name || t("TBD")} vs ${
        match.teamB?.name || t("TBD")
      }`,
    });
  };

  if (!selectedTournament && tournaments?.length > 0) {
    setSelectedTournament(tournaments[0]._id);
  }

  return (
    <div className="am-container">
      <div className="am-header">
        <h2 className="am-title">{t("ManageMatches")}</h2>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="am-select"
        >
          <option value="">{t("SelectTournament")}</option>
          {tournaments?.map((tournament) => (
            <option key={tournament._id} value={tournament._id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament ? (
        <div className="am-table-container">
          <table className="am-table">
            <thead className="am-thead">
              <tr>
                <th className="am-th">{t("Round")}</th>
                <th className="am-th">{t("Team1")}</th>
                <th className="am-th-center">{t("Score")}</th>
                <th className="am-th">{t("Team2")}</th>
                <th className="am-th">{t("TableStatus")}</th>
                <th className="am-th-right">{t("TableActions")}</th>
              </tr>
            </thead>
            <tbody className="am-tbody">
              {matches?.map((match) => (
                <tr key={match._id} className="am-tr">
                  <td className="am-td">
                    {t("RoundN", { count: match.round })}
                  </td>
                  <td className="am-td-team">
                    {match.teamA?.name || t("TBD")}
                  </td>
                  <td className="am-td-center">
                    {match.scoreA} - {match.scoreB}
                  </td>
                  <td className="am-td-team">
                    {match.teamB?.name || t("TBD")}
                  </td>
                  <td className="am-td">
                    <span
                      className={`am-status-badge ${
                        match.state === "final"
                          ? "am-status-final"
                          : match.state === "live"
                          ? "am-status-live"
                          : "am-status-pending"
                      }`}
                    >
                      {t(`MatchStatus_${match.state}`)}
                    </span>
                  </td>
                  <td className="am-td-right">
                    <div className="am-actions">
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="am-action-btn"
                        title={t("UpdateScore")}
                      >
                        <Edit size={16} />
                      </button>

                      {(match.state === "reported" ||
                        match.state === "final" ||
                        (match.state === "live" &&
                          (match.scoreA > 0 || match.scoreB > 0))) && (
                        <button
                          onClick={() => handleReject(match)}
                          className="am-action-btn am-btn-reject-row"
                          title={t("RejectResult")}
                          style={{ color: "#ef4444" }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {matches?.length === 0 && (
                <tr>
                  <td colSpan="6" className="am-table-empty">
                    {t("NoMatches")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="am-empty-state">{t("PleaseSelectTournament")}</div>
      )}

      {editingMatch && (
        <MatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
        />
      )}

      <ConfirmModal
        isOpen={confirmReject.isOpen}
        onClose={() => setConfirmReject({ ...confirmReject, isOpen: false })}
        onConfirm={() => rejectMutation.mutate(confirmReject.matchId)}
        title={t("ConfirmRejectMatch")}
        message={
          <>
            <p className="mb-2 font-semibold text-slate-200">
              {confirmReject.matchName}
            </p>
            <p>{t("RejectMatchWarning")}</p>
          </>
        }
        confirmText={t("Confirm")}
        type="danger"
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}

import ConfirmModal from "../../components/ConfirmModal";
import AlertModal from "../../components/AlertModal";

// Các import khác

function MatchModal({ isOpen, onClose, match }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    scoreA: match?.scoreA || 0,
    scoreB: match?.scoreB || 0,
  });
  const [proofUrls, setProofUrls] = useState(match?.proofUrls || []);
  const [newLink, setNewLink] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const handleError = (error, defaultMsg) => {
    const data = error.response?.data;
    let message = data?.message || defaultMsg;

    if (data?.code) {
      // Dịch lỗi theo mã (VD: Error_SCORE_LIMIT_EXCEEDED)
      const key = `Error_${data.code}`;
      const translated = t(key, data.params);

      // Dùng bản dịch nếu có (khác key gốc)
      if (translated && translated !== key) {
        message = translated;
      }
    }

    setAlertState({
      isOpen: true,
      title: t("Error"),
      message: message,
      type: "error",
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (data) =>
      (await api.put(`/api/matches/${match._id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
    onError: (error) => handleError(error, t("FailedToUpdateMatch")),
  });

  const confirmMutation = useMutation({
    mutationFn: async () =>
      (await api.patch(`/api/matches/${match._id}/confirm`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
    onError: (error) => handleError(error, t("FailedToConfirmMatch")),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProofUrls([...proofUrls, res.data.url]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(t("UploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    if (newLink) {
      setProofUrls([...proofUrls, newLink]);
      setNewLink("");
    }
  };

  const removeProof = (index) => {
    setProofUrls(proofUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, proofUrls });
  };

  if (!isOpen) return null;

  return (
    <div className="amm-overlay">
      <div className="amm-content">
        <h3 className="amm-title">{t("UpdateScore")}</h3>
        <div className="amm-scores">
          <div className="amm-score-box">
            <p className="amm-team-name">{match.teamA?.name || t("Team1")}</p>
            <input
              type="number"
              min="0"
              value={form.scoreA}
              onChange={(e) =>
                setForm({
                  ...form,
                  scoreA: Math.max(0, Number(e.target.value)),
                })
              }
              className="amm-score-input"
            />
          </div>
          <span className="amm-score-divider">-</span>
          <div className="amm-score-box">
            <p className="amm-team-name">{match.teamB?.name || t("Team2")}</p>
            <input
              type="number"
              min="0"
              value={form.scoreB}
              onChange={(e) =>
                setForm({
                  ...form,
                  scoreB: Math.max(0, Number(e.target.value)),
                })
              }
              className="amm-score-input"
            />
          </div>
        </div>

        <div className="amm-proof-section">
          <label className="amm-label">{t("Proof")}</label>

          <div className="amm-upload-box">
            <label className="amm-upload-label">
              <Upload size={16} />
              {isUploading ? t("Uploading") : t("UploadImage")}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="amm-link-box">
            <input
              type="text"
              placeholder={t("OrPasteLink")}
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="amm-link-input"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="amm-btn-add"
            >
              <Plus size={20} />
            </button>
          </div>

          {proofUrls.length > 0 && (
            <div className="amm-proof-list">
              {proofUrls.map((url, index) => (
                <div key={index} className="amm-proof-item">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="amm-proof-link"
                  >
                    <LinkIcon size={14} />
                    {url.split("/").pop()}
                  </a>
                  <button
                    onClick={() => removeProof(index)}
                    className="amm-btn-remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="amm-footer">
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="amm-btn-update"
          >
            {updateMutation.isPending ? t("Updating") : t("UpdateScoreBtn")}
          </button>

          {match.state !== "final" && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="amm-btn-confirm"
            >
              <CheckCircle size={16} />
              {t("ConfirmResult")}
            </button>
          )}

          <button onClick={onClose} className="amm-btn-close">
            {t("Close")}
          </button>
        </div>

        <AlertModal
          isOpen={alertState.isOpen}
          onClose={() => setAlertState({ ...alertState, isOpen: false })}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
        />
      </div>
    </div>
  );
}
