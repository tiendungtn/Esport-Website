import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2, Users, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/pages/admin-teams.css";

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
    <div className="ate-container">
      <div className="ate-header">
        <h2 className="ate-title">{t("ManageTeams")}</h2>
        <div className="ate-controls">
          <div className="ate-filter-container">
            <Filter size={16} className="ate-filter-icon" />
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="ate-filter-select"
            >
              <option value="">{t("AllGames")}</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleCreate} className="ate-create-btn">
            <Plus size={16} />
            {t("CreateTeam")}
          </button>
        </div>
      </div>

      <div className="ate-table-container">
        <table className="ate-table">
          <thead className="ate-thead">
            <tr>
              <th className="ate-th">{t("TeamName")}</th>
              <th className="ate-th">{t("TableGame")}</th>
              <th className="ate-th">{t("Tag")}</th>
              <th className="ate-th">{t("Captain")}</th>
              <th className="ate-th">{t("Members")}</th>
              <th className="ate-th-right">{t("TableActions")}</th>
            </tr>
          </thead>
          <tbody className="ate-tbody">
            {teams?.map((team) => (
              <tr key={team._id} className="ate-tr">
                <td className="ate-td-name">{team.name}</td>
                <td className="ate-td-game">{team.game || "-"}</td>
                <td className="ate-td">{team.tag}</td>
                <td className="ate-td">
                  {team.ownerUser?.profile?.displayName ||
                    team.ownerUser?.email}
                </td>
                <td className="ate-td">{team.members?.length || 0}</td>
                <td className="ate-td-right">
                  <div className="ate-actions">
                    <button
                      onClick={() => handleManageMembers(team)}
                      className="ate-action-btn"
                      title={t("ManageMembers")}
                    >
                      <Users size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(team)}
                      className="ate-action-btn"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(team._id)}
                      className="ate-action-btn-danger"
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
    <div className="atem-overlay">
      <div className="atem-content">
        <h3 className="atem-title">
          {team ? t("EditTeam") : t("CreateNewTeam")}
        </h3>
        <form onSubmit={handleSubmit} className="atem-form">
          <div>
            <label className="atem-label">{t("TeamName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="atem-input"
              required
            />
          </div>
          <div>
            <label className="atem-label">{t("TableGame")}</label>
            <select
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="atem-input"
            >
              {GAMES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="atem-label">{t("TeamTag")}</label>
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="atem-input"
            />
          </div>
          <div>
            <label className="atem-label">{t("LogoURL")}</label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="atem-input"
            />
          </div>
          <div className="atem-footer">
            <button type="button" onClick={onClose} className="atem-btn-cancel">
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="atem-btn-save"
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
    <div className="atem-overlay">
      <div className="atem-content-lg">
        <h3 className="atem-title">
          {t("TeamMembers")} {teamData.name}
        </h3>

        <div className="atem-search-container">
          <div className="atem-search-box">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("SearchUserPlaceholder")}
              className="atem-search-input"
            />
            <button onClick={handleSearch} className="atem-search-btn">
              {t("Search")}
            </button>
          </div>

          {searchResult.length > 0 && (
            <div className="atem-results">
              <p className="atem-results-title">{t("SearchResults")}</p>
              <div className="space-y-1">
                {searchResult.map((u) => (
                  <div key={u._id} className="atem-result-item">
                    <div className="atem-result-user">
                      <div className="atem-avatar"></div>
                      <span className="atem-user-name">
                        {u.profile?.displayName || u.email}
                      </span>
                      <span className="atem-user-email">({u.email})</span>
                    </div>
                    <button
                      onClick={() => addMemberMutation.mutate(u._id)}
                      className="atem-btn-add"
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
          <h4 className="atem-members-list-title">{t("MemberList")}</h4>
          <div className="atem-members-list">
            {teamData.members?.map((member) => (
              <div key={member._id} className="atem-member-item">
                <div className="atem-member-info">
                  <div className="atem-member-avatar"></div>
                  <div>
                    <p className="atem-member-name">
                      {member.profile?.displayName || "Unnamed"}
                    </p>
                    <p className="atem-member-email">{member.email}</p>
                  </div>
                </div>
                {member._id !== teamData.ownerUser?._id && (
                  <button
                    onClick={() => removeMemberMutation.mutate(member._id)}
                    className="atem-btn-remove"
                  >
                    {t("Remove")}
                  </button>
                )}
                {member._id === teamData.ownerUser?._id && (
                  <span className="atem-captain-badge">{t("Captain")}</span>
                )}
              </div>
            ))}
            {teamData.members?.length === 0 && (
              <div className="atem-no-members">{t("NoMembers")}</div>
            )}
          </div>
        </div>

        <div className="atem-members-footer">
          <button onClick={onClose} className="atem-btn-close">
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
