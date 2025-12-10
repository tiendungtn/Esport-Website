import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";
import "../styles/pages/profile.css";

export default function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    displayName: "",
    avatar: "",
    phone: "",
    email: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchProfile();
    fetchMyTeams();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/users/me");
      const { email, role, profile } = res.data;
      setProfile({
        email,
        role,
        displayName: profile?.displayName || "",
        avatar: profile?.avatar || "",
        phone: profile?.phone || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
      setMessage({
        type: "error",
        text: `${t("FailedToUpdateProfile")}: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const [myTeams, setMyTeams] = useState([]);
  const fetchMyTeams = async () => {
    try {
      const res = await api.get("/api/teams/mine");
      setMyTeams(res.data);
    } catch (error) {
      console.error("Failed to fetch teams", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      await api.put("/api/users/me", {
        displayName: profile.displayName,
        avatar: profile.avatar,
        phone: profile.phone,
      });
      setMessage({ type: "success", text: t("ProfileUpdatedSuccess") });
    } catch (error) {
      console.error("Failed to update profile", error);
      setMessage({ type: "error", text: t("FailedToUpdateProfile") });
    }
  };

  if (loading) {
    return <div className="profile-loading">{t("LoadingProfile")}</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">{t("ProfileManagement")}</h1>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-container">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="profile-avatar-img"
              />
            ) : (
              <span className="profile-avatar-placeholder">
                {profile.displayName
                  ? profile.displayName.charAt(0)
                  : profile.email.charAt(0)}
              </span>
            )}
          </div>
          <div className="profile-info">
            <h2 className="profile-name">{profile.displayName || t("User")}</h2>
            <p className="profile-email">{profile.email}</p>
            <span className="profile-role-badge">{profile.role}</span>
          </div>
        </div>

        {message.text && (
          <div
            className={`profile-message ${
              message.type === "success"
                ? "profile-message-success"
                : "profile-message-error"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div>
            <label className="profile-label">{t("DisplayName")}</label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="profile-input"
              placeholder={t("EnterDisplayName")}
            />
          </div>

          <div>
            <label className="profile-label">{t("Avatar")}</label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600 flex items-center justify-center shrink-0">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs text-center px-1">
                    {profile.displayName
                      ? profile.displayName.charAt(0)
                      : profile.email.charAt(0)}
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
                      // setLoading(true); // Optional: manage loading state specificaly for upload
                      const res = await api.post("/api/upload", formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      setProfile({ ...profile, avatar: res.data.url });
                    } catch (err) {
                      console.error("Upload failed", err);
                      setMessage({
                        type: "error",
                        text: "Failed to upload avatar",
                      });
                    } finally {
                      // setLoading(false);
                    }
                  }}
                  className="profile-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="profile-label">{t("PhoneNumber")}</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="profile-input"
              placeholder={t("EnterPhoneNumber")}
            />
          </div>

          <div className="profile-submit-container">
            <button type="submit" className="profile-submit-btn">
              {t("SaveChanges")}
            </button>
          </div>
        </form>
      </div>

      <div className="profile-section-title">
        {t("MyTeams") || "My Teams"}
        <a href="/teams/create" className="profile-create-team-btn">
          + {t("CreateTeam") || "Create Team"}
        </a>
      </div>

      {myTeams.length > 0 ? (
        <div className="profile-teams-grid">
          {myTeams.map((team) => (
            <a
              key={team._id}
              href={`/teams/${team._id}`}
              className="profile-team-card"
            >
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="profile-team-logo"
                />
              ) : (
                <div className="profile-team-placeholder">
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-team-info">
                <div className="profile-team-name">{team.name}</div>
                <div className="profile-team-role">
                  {team.ownerUser === profile._id ||
                  (typeof team.ownerUser === "object" &&
                    team.ownerUser._id === profile._id)
                    ? "Owner/Captain"
                    : "Member"}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="profile-empty-teams">
          {t("NoTeamsJoined") || "You haven't joined any teams yet."}
        </div>
      )}
    </div>
  );
}
