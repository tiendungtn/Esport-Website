import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Plus, Edit, Trash2, Users, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/pages/admin-teams.css";

import {
  getGameNames,
  translateGameName,
  gameNameToDB,
} from "../../lib/gameTranslations";
import { translateBackendError } from "../../lib/errorTranslations";
import AlertModal from "../../components/AlertModal";
import "../../styles/pages/admin-teams.css";

export default function AdminTeams() {
  const { t } = useTranslation();
  const GAMES = getGameNames();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
  const [selectedGame, setSelectedGame] = useState("");
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", selectedGame],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGame) params.append("game", gameNameToDB(selectedGame));
      return (await api.get(`/api/teams?${params.toString()}`)).data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.delete(`/api/teams/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setDeleteSuccessMessage(t("TeamDeletedSuccess"));
    },
  });

  const handleDelete = (id) => {
    // Find team object
    const team = teams.find((t) => t._id === id);
    if (team) {
      setTeamToDelete(team);
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

  if (isLoading) return <div>{t("Loading")}</div>;

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
                <td className="ate-td-game">
                  {translateGameName(team.game) || t("NotAvailable")}
                </td>
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

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="atem-overlay">
          <div className="atem-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atem-title text-xl text-red-500">
                {t("ConfirmDeleteTeam")}
              </h3>
              <button
                onClick={() => setTeamToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 size={20} className="hidden" />X
              </button>
            </div>
            <p className="text-slate-300 mb-6">
              {t("AreYouSureDeleteTeam", {
                name: teamToDelete.name,
              })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTeamToDelete(null)}
                className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                style={{ height: "40px", lineHeight: "1" }} // Inline fix matches button style
              >
                {t("Cancel")}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(teamToDelete._id);
                  setTeamToDelete(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                style={{ height: "40px", lineHeight: "1" }}
              >
                {t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {deleteSuccessMessage && (
        <div className="atem-overlay">
          <div className="atem-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atem-title text-xl text-green-500">
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
                style={{ height: "40px", lineHeight: "1" }}
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}

function TeamModal({ isOpen, onClose, team }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const GAMES = getGameNames();
  const [form, setForm] = useState({
    name: team?.name || "",
    tag: team?.tag || "",
    game: translateGameName(team?.game) || GAMES[0],
    logoUrl: team?.logoUrl || "",
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (team) {
        return (
          await api.put(`/api/teams/${team._id}`, {
            ...data,
            game: gameNameToDB(data.game),
          })
        ).data;
      } else {
        return (
          await api.post("/api/teams", {
            ...data,
            game: gameNameToDB(data.game),
          })
        ).data;
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
            <label className="atem-label">{t("Logo")}</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center shrink-0">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt={t("LogoPreview")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs text-center px-1">
                    {t("NoLogo")}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const formData = new FormData();
                    formData.append("file", file);

                    try {
                      // setLoading(true);
                      const res = await api.post("/api/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      setForm({ ...form, logoUrl: res.data.url });
                    } catch (err) {
                      console.error("Upload failed", err);
                      alert(t("UploadImageFailed"));
                    } finally {
                      // setLoading(false);
                    }
                  }}
                  className="atem-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                />
              </div>
            </div>
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

  // Lấy dữ liệu team mới nhất để xem thành viên
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
    onError: (err) =>
      alert(
        translateBackendError(err.response?.data?.message, t, "AddMemberError")
      ),
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
              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {searchResult.map((u) => (
                  <div key={u._id} className="atem-result-item">
                    <div className="atem-result-user">
                      <div className="atem-avatar">
                        {u.profile?.avatar ? (
                          <img
                            src={u.profile.avatar}
                            alt=""
                            className="atem-avatar-img"
                          />
                        ) : (
                          <span className="atem-avatar-placeholder">
                            {(u.profile?.displayName ||
                              u.email)?.[0]?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
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
                  <div className="atem-member-avatar">
                    {member.profile?.avatar ? (
                      <img
                        src={member.profile.avatar}
                        alt=""
                        className="atem-member-avatar-img"
                      />
                    ) : (
                      <span className="atem-member-avatar-placeholder">
                        {(member.profile?.displayName ||
                          member.email)?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="atem-member-name">
                      {member.profile?.displayName || t("Unnamed")}
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
