import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

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
    return (
      <div className="text-center py-10 text-slate-400">
        {t("LoadingProfile")}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-100">
        {t("ProfileManagement")}
      </h1>

      <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-slate-700 shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl text-slate-500 uppercase">
                {profile.displayName
                  ? profile.displayName.charAt(0)
                  : profile.email.charAt(0)}
              </span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-slate-100">
              {profile.displayName || t("User")}
            </h2>
            <p className="text-sm text-slate-400">{profile.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
              {profile.role}
            </span>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-3 rounded text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              {t("DisplayName")}
            </label>
            <input
              type="text"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder={t("EnterDisplayName")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              {t("AvatarURL")}
            </label>
            <input
              type="text"
              value={profile.avatar}
              onChange={(e) =>
                setProfile({ ...profile, avatar: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder={t("EnterAvatarURL")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">
              {t("PhoneNumber")}
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder={t("EnterPhoneNumber")}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              {t("SaveChanges")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
