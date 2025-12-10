import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { getGameNames } from "../lib/gameTranslations";
import "../styles/pages/create-team.css";

export default function CreateTeam() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tag: "",
    game: getGameNames()[0] || "League of Legends",
    logoUrl: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/teams", form);
      navigate(`/teams/${res.data._id}`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const games = getGameNames();

  return (
    <div className="ct-container">
      <h2 className="ct-title">{t("CreateNewTeam")}</h2>

      <div className="ct-form-card">
        {error && <div className="ct-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="ct-input-group">
            <label className="ct-label">{t("TeamName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="ct-input"
              required
              placeholder={
                t("CreateTeamNamePlaceholder") || "e.g. Hanoi Legends"
              }
            />
          </div>

          <div className="ct-input-group">
            <label className="ct-label">{t("TableGame")}</label>
            <select
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="ct-input appearance-none"
            >
              {games.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="ct-input-group">
              <label className="ct-label">{t("TeamTag")}</label>
              <input
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="ct-input"
                placeholder="e.g. HNL"
                maxLength={5}
              />
            </div>

            <div className="ct-input-group">
              <label className="ct-label">{t("Logo")}</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600 flex items-center justify-center shrink-0">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-xs text-center px-1">
                      No Logo
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
                        setLoading(true);
                        const res = await api.post("/api/upload", formData, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        setForm({ ...form, logoUrl: res.data.url });
                      } catch (err) {
                        console.error("Upload failed", err);
                        setError("Failed to upload image");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="ct-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Start by uploading a logo (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="ct-footer">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="ct-btn-cancel"
            >
              {t("Cancel")}
            </button>
            <button type="submit" disabled={loading} className="ct-btn-submit">
              {loading ? t("Saving") : t("CreateTeam")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
