import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { Trash2, UserPlus, Search, X, Edit } from "lucide-react";
import { translateGameName } from "../lib/gameTranslations";
import { translateBackendError } from "../lib/errorTranslations";
import AlertModal from "../components/AlertModal";
import "../styles/pages/public-team-profile.css";

export default function PublicTeamProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const {
    data: team,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => (await api.get(`/api/teams/${id}`)).data,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId) => {
      return (await api.post(`/api/teams/${id}/members`, { userId })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["team", id]);
      setSearchEmail("");
      setSearchResults([]);
      setIsModalOpen(false);
    },
    onError: (err) => {
      setAlertState({
        isOpen: true,
        title: t("Error"),
        message: translateBackendError(
          err.response?.data?.message,
          t,
          "FailedToAddMember"
        ),
        type: "error",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      return (
        await api.delete(`/api/teams/${id}/members`, {
          data: { userId },
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["team", id]);
      setSuccessMessage(t("MemberRemovedSuccess"));
    },
    onError: (err) => {
      setAlertState({
        isOpen: true,
        title: t("Error"),
        message: translateBackendError(
          err.response?.data?.message,
          t,
          "FailedToRemoveMember"
        ),
        type: "error",
      });
    },
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearchError("");
    try {
      const res = await api.get(`/api/users?search=${searchEmail}`);
      setSearchResults(res.data);
      if (res.data.length === 0) {
        setSearchError(t("NoUsersFound"));
      }
    } catch (err) {
      console.error(err);
      setSearchError(t("GenericError"));
    }
  };

  if (isLoading) return <div className="ptp-loading">{t("Loading")}</div>;
  if (error) return <div className="ptp-error">{t("FailedToLoadTeam")}</div>;
  if (!team) return <div className="ptp-error">{t("TeamNotFound")}</div>;

  const isOwner = user && team.ownerUser && user.id === team.ownerUser._id;

  return (
    <div className="ptp-container">
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
      <div className="ptp-header">
        {team.logoUrl ? (
          <img src={team.logoUrl} alt={team.name} className="ptp-logo" />
        ) : (
          <div className="ptp-logo-placeholder">
            {(team.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="ptp-info">
          <h1 className="ptp-name">{team.name}</h1>
          <div className="ptp-meta">
            {team.tag && <span className="ptp-tag">{team.tag}</span>}
            {team.game && (
              <span className="ptp-game">{translateGameName(team.game)}</span>
            )}
          </div>
          {isOwner && (
            <button
              onClick={() => setIsEditTeamModalOpen(true)}
              className="mt-2 flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
            >
              <Edit size={16} />
              {t("EditInfo")}
            </button>
          )}
        </div>
      </div>

      <div className="ptp-content">
        <div className="ptp-section-header">
          <h2 className="ptp-section-title">{t("Roster")}</h2>
          {isOwner && (
            <button
              className="ptp-add-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <UserPlus size={18} />
              {t("AddMember")}
            </button>
          )}
        </div>

        <div className="ptp-roster-grid">
          {team.members && team.members.length > 0 ? (
            team.members.map((member) => (
              <div key={member._id} className="ptp-member-card group">
                <div className="ptp-member-avatar-container">
                  {member.profile?.avatar ? (
                    <img
                      src={member.profile.avatar}
                      alt=""
                      className="ptp-member-avatar-img"
                    />
                  ) : (
                    <div className="ptp-member-avatar-placeholder">
                      {member.profile?.displayName
                        ? member.profile.displayName.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>
                <div className="ptp-member-info">
                  <div className="ptp-member-name">
                    {member.profile?.displayName || t("Unknown")}
                  </div>
                  <div className="ptp-member-email">{member.email}</div>
                  {team.ownerUser?._id === member._id && (
                    <span className="ptp-captain-badge">{t("Captain")}</span>
                  )}
                </div>
                {isOwner && team.ownerUser?._id !== member._id && (
                  <button
                    className="ptp-remove-btn"
                    onClick={() => setMemberToRemove(member)}
                    title={t("RemoveMember")}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="ptp-empty-roster">{t("NoMembers")}</p>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="ptp-modal-overlay">
          <div className="ptp-modal">
            <div className="ptp-modal-header">
              <h3 className="ptp-modal-title">{t("AddMember")}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="ptp-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="ptp-modal-body">
              <form onSubmit={handleSearch} className="ptp-search-form">
                <Search size={18} className="ptp-search-icon" />
                <input
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t("SearchUserEmail")}
                  className="ptp-search-input"
                  autoFocus
                />
              </form>

              {searchError && (
                <div className="ptp-search-error text-red-400 mb-4 text-sm text-center">
                  {searchError}
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map((u) => (
                  <div key={u._id} className="ptp-result-item">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200">
                        {u.profile?.displayName || t("Unknown")}
                      </span>
                      <span className="text-xs text-slate-500">{u.email}</span>
                    </div>
                    <button
                      onClick={() => addMemberMutation.mutate(u._id)}
                      disabled={addMemberMutation.isPending}
                      className="ptp-result-add-btn"
                    >
                      {addMemberMutation.isPending ? t("Adding") : t("Add")}
                    </button>
                  </div>
                ))}
                {searchResults.length === 0 && !searchError && searchEmail && (
                  <p className="text-center text-slate-600 text-sm py-4">
                    {t("PressEnterToSearch")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="ptp-modal-overlay">
          <div className="ptp-modal">
            <div className="ptp-modal-header">
              <h3 className="ptp-modal-title">{t("ConfirmRemoveMember")}</h3>
              <button
                onClick={() => setMemberToRemove(null)}
                className="ptp-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="ptp-modal-body">
              <p className="text-slate-300 mb-6">
                {t("AreYouSureRemoveMember", {
                  name:
                    memberToRemove.profile?.displayName || memberToRemove.email,
                }) ||
                  `${t("AreYouSureRemoveMember")} ${
                    memberToRemove.profile?.displayName || memberToRemove.email
                  }?`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeMemberMutation.mutate(memberToRemove._id);
                    setMemberToRemove(null);
                  }}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
                >
                  {t("Remove")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="ptp-modal-overlay">
          <div className="ptp-modal">
            <div className="ptp-modal-header">
              <h3 className="ptp-modal-title">
                {t("RegistrationSuccessTitle")}
              </h3>
              <button
                onClick={() => setSuccessMessage("")}
                className="ptp-modal-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="ptp-modal-body">
              <p className="text-slate-300 mb-6">{successMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setSuccessMessage("")}
                  className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors"
                >
                  {t("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        team={team}
        onSuccess={() => {
          queryClient.invalidateQueries(["team", id]);
          setIsEditTeamModalOpen(false);
        }}
        onError={(msg) =>
          setAlertState({
            isOpen: true,
            title: t("Error"),
            message: translateBackendError(msg, t, "FailedToUpdateTeam"),
            type: "error",
          })
        }
      />
    </div>
  );
}

function EditTeamModal({ isOpen, onClose, team, onSuccess, onError }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: team?.name || "",
    tag: team?.tag || "",
    logoUrl: team?.logoUrl || "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/api/teams/${team._id}`, form);
      onSuccess();
    } catch (err) {
      console.error(err);
      onError(err.response?.data?.message || "");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm({ ...form, logoUrl: res.data.url });
    } catch (err) {
      console.error("Upload failed", err);
      onError(t("UploadImageFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ptp-modal-overlay">
      <div className="ptp-modal">
        <div className="ptp-modal-header">
          <h3 className="ptp-modal-title">{t("EditTeam")}</h3>
          <button onClick={onClose} className="ptp-modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="ptp-modal-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                {t("TeamName")}
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                {t("TeamTag")}
              </label>
              <input
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                {t("Logo")}
              </label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-slate-800 rounded flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt={t("Preview")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">
                      {t("NoLogo")}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-900/50 file:text-violet-300 hover:file:bg-violet-900/70 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? t("Saving") : t("Save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
