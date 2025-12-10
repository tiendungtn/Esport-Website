import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2, Users, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

const GAMES = [
  "Liên Minh Huyền Thoại",
  "Tốc Chiến",
  "Liên Quân",
  "Valorant",
  "CS2",
  "FC Online",
];

export default function AdminTeams() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
  const [selectedGame, setSelectedGame] = useState("");

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", selectedGame],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGame) params.append("game", selectedGame);
      return (await api.get(`/api/teams?${params.toString()}`)).data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.delete(`/api/teams/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const handleDelete = async (id) => {
    if (confirm(t("DeleteTeamConfirm"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTeam(null);
    setIsModalOpen(true);
  };

  const handleManageMembers = (team) => {
    setSelectedTeamForMembers(team);
    setIsMembersModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("ManageTeams")}
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="rounded-md border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              <option value="">{t("AllGames")}</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            <Plus size={16} />
            {t("CreateTeam")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 uppercase">
            <tr>
              <th className="px-6 py-3">{t("TeamName")}</th>
              <th className="px-6 py-3">{t("TableGame")}</th>
              <th className="px-6 py-3">{t("Tag")}</th>
              <th className="px-6 py-3">{t("Captain")}</th>
              <th className="px-6 py-3">{t("Members")}</th>
              <th className="px-6 py-3 text-right">{t("TableActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {teams?.map((team) => (
              <tr key={team._id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-100">
                  {team.name}
                </td>
                <td className="px-6 py-4 text-slate-300">{team.game || "-"}</td>
                <td className="px-6 py-4">{team.tag}</td>
                <td className="px-6 py-4">
                  {team.ownerUser?.profile?.displayName ||
                    team.ownerUser?.email}
                </td>
                <td className="px-6 py-4">{team.members?.length || 0}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleManageMembers(team)}
                      className="p-2 text-slate-400 hover:text-sky-400"
                      title={t("ManageMembers")}
                    >
                      <Users size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(team)}
                      className="p-2 text-slate-400 hover:text-sky-400"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(team._id)}
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
        <TeamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          team={editingTeam}
        />
      )}

      {isMembersModalOpen && (
        <MembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          team={selectedTeamForMembers}
        />
      )}
    </div>
  );
}

function TeamModal({ isOpen, onClose, team }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: team?.name || "",
    tag: team?.tag || "",
    game: team?.game || GAMES[0],
    logoUrl: team?.logoUrl || "",
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (team) {
        return (await api.put(`/api/teams/${team._id}`, data)).data;
      } else {
        return (await api.post("/api/teams", data)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
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
          {team ? t("EditTeam") : t("CreateNewTeam")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("TeamName")}
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
              {t("TableGame")}
            </label>
            <select
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            >
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("TeamTag")}
            </label>
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">
              {t("LogoURL")}
            </label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
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

function MembersModal({ isOpen, onClose, team }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [searchResult, setSearchResult] = useState([]);

  // Fetch latest team data to get members
  const { data: teamData } = useQuery({
    queryKey: ["team", team?._id],
    queryFn: async () => {
      return (await api.get(`/api/teams/${team._id}`)).data;
    },
    enabled: !!team,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId) => {
      return (await api.post(`/api/teams/${team._id}/members`, { userId }))
        .data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", team._id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setEmail("");
      setSearchResult([]);
    },
    onError: (err) => alert(err.response?.data?.message || t("AddMemberError")),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      return (
        await api.delete(`/api/teams/${team._id}/members`, {
          data: { userId },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", team._id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const handleSearch = async () => {
    if (!email) return;
    try {
      const res = await api.get(`/api/users?search=${email}`);
      setSearchResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !teamData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          {t("TeamMembers")} {teamData.name}
        </h3>

        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("SearchUserPlaceholder")}
              className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              {t("Search")}
            </button>
          </div>

          {searchResult.length > 0 && (
            <div className="rounded-md border border-slate-800 bg-slate-900 p-2">
              <p className="mb-2 text-xs text-slate-400">
                {t("SearchResults")}
              </p>
              <div className="space-y-1">
                {searchResult.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between rounded p-2 hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-700"></div>
                      <span className="text-sm text-slate-200">
                        {u.profile?.displayName || u.email}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({u.email})
                      </span>
                    </div>
                    <button
                      onClick={() => addMemberMutation.mutate(u._id)}
                      className="text-xs font-medium text-sky-500 hover:text-sky-400"
                    >
                      {t("Add")}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400">
            {t("MemberList")}
          </h4>
          <div className="divide-y divide-slate-800 rounded-md border border-slate-800 bg-slate-900/50">
            {teamData.members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-700"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {member.profile?.displayName || "Unnamed"}
                    </p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                </div>
                {member._id !== teamData.ownerUser?._id && (
                  <button
                    onClick={() => removeMemberMutation.mutate(member._id)}
                    className="text-xs text-red-500 hover:text-red-400"
                  >
                    {t("Remove")}
                  </button>
                )}
                {member._id === teamData.ownerUser?._id && (
                  <span className="text-xs text-sky-500">{t("Captain")}</span>
                )}
              </div>
            ))}
            {teamData.members?.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500">
                {t("NoMembers")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
