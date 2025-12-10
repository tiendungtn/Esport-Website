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

export default function AdminMatches() {
  const { t } = useTranslation();
  const [selectedTournament, setSelectedTournament] = useState("");
  const [editingMatch, setEditingMatch] = useState(null);

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

  if (!selectedTournament && tournaments?.length > 0) {
    setSelectedTournament(tournaments[0]._id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("ManageMatches")}
        </h2>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
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
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-slate-200 uppercase">
              <tr>
                <th className="px-6 py-3">{t("Round")}</th>
                <th className="px-6 py-3">{t("Team1")}</th>
                <th className="px-6 py-3 text-center">{t("Score")}</th>
                <th className="px-6 py-3">{t("Team2")}</th>
                <th className="px-6 py-3">{t("TableStatus")}</th>
                <th className="px-6 py-3 text-right">{t("TableActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matches?.map((match) => (
                <tr key={match._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4">Round {match.round}</td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {match.teamA?.name || "TBD"}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-100">
                    {match.scoreA} - {match.scoreB}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {match.teamB?.name || "TBD"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        match.state === "final"
                          ? "bg-green-500/10 text-green-500"
                          : match.state === "live"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {match.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingMatch(match)}
                        className="p-2 text-slate-400 hover:text-sky-400"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {matches?.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    {t("NoMatches")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
          {t("PleaseSelectTournament")}
        </div>
      )}

      {editingMatch && (
        <MatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
        />
      )}
    </div>
  );
}

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

  const updateMutation = useMutation({
    mutationFn: async (data) =>
      (await api.put(`/api/matches/${match._id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () =>
      (await api.patch(`/api/matches/${match._id}/confirm`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {t("UpdateScore")}
        </h3>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="mb-2 text-sm font-medium text-slate-300">
              {match.teamA?.name || "Team A"}
            </p>
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
              className="w-20 rounded-md border border-slate-800 bg-slate-900 p-2 text-center text-xl font-bold text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <span className="text-slate-500">-</span>
          <div className="text-center">
            <p className="mb-2 text-sm font-medium text-slate-300">
              {match.teamB?.name || "Team B"}
            </p>
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
              className="w-20 rounded-md border border-slate-800 bg-slate-900 p-2 text-center text-xl font-bold text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {t("Proof")}
          </label>

          <div className="mb-3 flex gap-2">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-700 bg-slate-900/50 py-2 text-sm text-slate-400 hover:border-sky-500 hover:text-sky-500">
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

          <div className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder={t("OrPasteLink")}
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="rounded-md bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-sky-400"
            >
              <Plus size={20} />
            </button>
          </div>

          {proofUrls.length > 0 && (
            <div className="space-y-2">
              {proofUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900 p-2"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-sky-400 hover:underline truncate max-w-[200px]"
                  >
                    <LinkIcon size={14} />
                    {url.split("/").pop()}
                  </a>
                  <button
                    onClick={() => removeProof(index)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {updateMutation.isPending ? t("Updating") : t("UpdateScoreBtn")}
          </button>

          {match.state !== "final" && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20"
            >
              <CheckCircle size={16} />
              {t("ConfirmResult")}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-md border border-slate-800 py-2 text-sm font-medium text-slate-400 hover:bg-slate-900"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
