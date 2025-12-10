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
        text: `${t("FailedToUpdateProfile")}: ${error.message} - ${
          error.response?.status
        } ${JSON.stringify(error.response?.data)}`,
      });
    } finally {
      setLoading(false);
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
            <label className="profile-label">{t("AvatarURL")}</label>
            <input
              type="text"
              value={profile.avatar}
              onChange={(e) =>
                setProfile({ ...profile, avatar: e.target.value })
              }
              className="profile-input"
              placeholder={t("EnterAvatarURL")}
            />
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
    </div>
  );
}
