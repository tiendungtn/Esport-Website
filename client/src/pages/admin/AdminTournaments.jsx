import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2, ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateGameName } from "../../lib/gameTranslations";
import AdminRegistrations from "./AdminRegistrations";
import "../../styles/pages/admin-tournaments.css";

export default function AdminTournaments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/tournaments/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setDeleteSuccessMessage(t("TournamentDeletedSuccess"));
    },
  });

  const handleDelete = (tournament) => {
    setTournamentToDelete(tournament);
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTournament(null);
    setIsModalOpen(true);
  };

  const handleViewRegistrations = (id) => {
    setSelectedTournamentId(id);
    setIsRegistrationsOpen(true);
  };

  if (isLoading) return <div>{t("Loading")}</div>;

  return (
    <div className="at-container">
      <div className="at-header">
        <h2 className="at-title">{t("ManageTournaments")}</h2>
        <button onClick={handleCreate} className="at-create-btn">
          <Plus size={16} />
          {t("CreateTournamentBtn")}
        </button>
      </div>

      <div className="at-table-container">
        <table className="at-table">
          <thead className="at-thead">
            <tr>
              <th className="at-th">{t("TableName")}</th>
              <th className="at-th">{t("TableGame")}</th>
              <th className="at-th">{t("TableTeams")}</th>
              <th className="at-th">{t("TableStatus")}</th>
              <th className="at-th-right">{t("TableActions")}</th>
            </tr>
          </thead>
          <tbody className="at-tbody">
            {tournaments?.map((tournament) => (
              <tr key={tournament._id} className="at-tr">
                <td className="at-td-name">{tournament.name}</td>
                <td className="at-td">{translateGameName(tournament.game)}</td>
                <td className="at-td">{tournament.maxTeams}</td>
                <td className="at-td">
                  <span
                    className={`at-status-badge ${
                      tournament.status === "open"
                        ? "at-status-open"
                        : tournament.status === "ongoing"
                        ? "at-status-ongoing"
                        : "at-status-finished"
                    }`}
                  >
                    {tournament.status === "open" && t("StatusOpen")}
                    {tournament.status === "ongoing" && t("StatusOngoing")}
                    {tournament.status === "finished" && t("StatusFinished")}
                    {tournament.status === "draft" && t("StatusDraft")}
                  </span>
                </td>
                <td className="at-td-right">
                  <div className="at-actions">
                    <button
                      onClick={() => handleViewRegistrations(tournament._id)}
                      className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                      title={t("ViewRegistrations")}
                    >
                      <ClipboardCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="at-action-btn-edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament)}
                      className="at-action-btn-delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <TournamentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tournament={editingTournament}
        />
      )}

      {isRegistrationsOpen && selectedTournamentId && (
        <AdminRegistrations
          tournamentId={selectedTournamentId}
          onClose={() => setIsRegistrationsOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {tournamentToDelete && (
        <div className="atm-overlay">
          <div className="atm-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atm-title text-xl text-red-500">
                {t("ConfirmDeleteTournament")}
              </h3>
              <button
                onClick={() => setTournamentToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 size={20} className="hidden" />{" "}
                {/* Hidden icon, just for consistency if needed, but we use X usually */}
                X
              </button>
            </div>
            <p className="text-slate-300 mb-6">
              {t("AreYouSureDeleteTournament", {
                name: tournamentToDelete.name,
              })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTournamentToDelete(null)}
                className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(tournamentToDelete._id);
                  setTournamentToDelete(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                {t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {deleteSuccessMessage && (
        <div className="atm-overlay">
          <div className="atm-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atm-title text-xl text-green-500">
                {t("RegistrationSuccessTitle")}
              </h3>
              <button
                onClick={() => setDeleteSuccessMessage("")}
                className="text-slate-400 hover:text-white"
              >
                X
              </button>
            </div>
            <p className="text-slate-300 mb-6">{deleteSuccessMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteSuccessMessage("")}
                className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentModal({ isOpen, onClose, tournament }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Helper to format Date to input datetime-local string (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    // Adjust to local time string specifically for input value
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [form, setForm] = useState({
    name: tournament?.name || "",
    game: tournament?.game || "",
    maxTeams: tournament?.maxTeams || 16,
    description: tournament?.description || "",
    schedule: {
      regOpen: formatDateForInput(tournament?.schedule?.regOpen),
      regClose: formatDateForInput(tournament?.schedule?.regClose),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Clean up schedule if empty values
      const payload = { ...data };
      if (payload.schedule) {
        if (!payload.schedule.regOpen) delete payload.schedule.regOpen;
        if (!payload.schedule.regClose) delete payload.schedule.regClose;
      }

      if (tournament) {
        return (await api.put(`/api/tournaments/${tournament._id}`, payload))
          .data;
      } else {
        return (
          await api.post("/api/tournaments", { ...payload, format: "SE" })
        ).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="atm-overlay">
      <div className="atm-content">
        <h3 className="atm-title">
          {tournament ? t("EditTournament") : t("CreateNewTournament")}
        </h3>
        <form onSubmit={handleSubmit} className="atm-form">
          <div>
            <label className="atm-label">{t("FormName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="atm-input"
              required
            />
          </div>
          <div>
            <label className="atm-label">{t("FormGame")}</label>
            <input
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="atm-input"
              required
            />
          </div>
          <div>
            <label className="atm-label">{t("FormMaxTeams")}</label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) =>
                setForm({ ...form, maxTeams: Number(e.target.value) })
              }
              className="atm-input"
            />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label className="atm-label">{t("FormRegOpen")}</label>
              <input
                type="datetime-local"
                value={form.schedule.regOpen}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schedule: { ...form.schedule, regOpen: e.target.value },
                  })
                }
                className="atm-input"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="atm-label">{t("FormRegClose")}</label>
              <input
                type="datetime-local"
                value={form.schedule.regClose}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schedule: { ...form.schedule, regClose: e.target.value },
                  })
                }
                className="atm-input"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div>
            <label className="atm-label">{t("FormDescription")}</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="atm-textarea"
              rows={3}
            />
          </div>
          <div className="atm-footer">
            <button type="button" onClick={onClose} className="atm-btn-cancel">
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="atm-btn-save"
            >
              {mutation.isPending ? t("Saving") : t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
