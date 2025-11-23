import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateGameName } from "../../lib/gameTranslations";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("ManageTournaments")}
        </h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
        >
          <Plus size={16} />
          {t("CreateTournamentBtn")}
        </button>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 uppercase">
            <tr>
              <th className="px-6 py-3">{t("TableName")}</th>
              <th className="px-6 py-3">{t("TableGame")}</th>
              <th className="px-6 py-3">{t("TableTeams")}</th>
              <th className="px-6 py-3">{t("TableStatus")}</th>
              <th className="px-6 py-3 text-right">{t("TableActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tournaments?.map((tournament) => (
              <tr key={tournament._id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-100">
                  {tournament.name}
                </td>
                <td className="px-6 py-4">
                  {translateGameName(tournament.game)}
                </td>
                <td className="px-6 py-4">{tournament.maxTeams}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      tournament.status === "open"
                        ? "bg-green-500/10 text-green-500"
                        : tournament.status === "ongoing"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-slate-500/10 text-slate-500"
                    }`}
                  >
                    {tournament.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="p-2 text-slate-400 hover:text-sky-400"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament._id)}
                      className="p-2 text-slate-400 hover:text-red-400"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {tournament ? t("EditTournament") : t("CreateNewTournament")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("FormName")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("FormGame")}
            </label>
            <input
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("FormMaxTeams")}
            </label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) =>
                setForm({ ...form, maxTeams: Number(e.target.value) })
              }
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("FormDescription")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {mutation.isPending ? t("Saving") : t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
