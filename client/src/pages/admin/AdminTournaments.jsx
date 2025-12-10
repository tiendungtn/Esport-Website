import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateGameName } from "../../lib/gameTranslations";
import "../../styles/pages/admin-tournaments.css";

export default function AdminTournaments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/tournaments/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });

  const handleDelete = async (id) => {
    if (confirm(t("DeleteConfirm"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTournament(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

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
                    {tournament.status}
                  </span>
                </td>
                <td className="at-td-right">
                  <div className="at-actions">
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="at-action-btn-edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament._id)}
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
    </div>
  );
}

function TournamentModal({ isOpen, onClose, tournament }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: tournament?.name || "",
    game: tournament?.game || "",
    maxTeams: tournament?.maxTeams || 16,
    description: tournament?.description || "",
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (tournament) {
        return (await api.put(`/api/tournaments/${tournament._id}`, data)).data;
      } else {
        return (await api.post("/api/tournaments", { ...data, format: "SE" }))
          .data;
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
