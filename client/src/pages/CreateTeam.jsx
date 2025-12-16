import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { getGameNames, gameNameToDB } from "../lib/gameTranslations";
import { translateBackendError } from "../lib/errorTranslations";
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
      const res = await api.post("/api/teams", {
        ...form,
        game: gameNameToDB(form.game),
      });
      navigate(`/teams/${res.data._id}`);
    } catch (err) {
      console.error(err);
      setError(
        translateBackendError(
          err.response?.data?.message,
          t,
          "FailedToCreateTeam"
        )
      );
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
              placeholder={t("CreateTeamNamePlaceholder")}
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

          <div className="ct-grid">
            <div className="ct-input-group">
              <label className="ct-label">{t("TeamTag")}</label>
              <input
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="ct-input"
                placeholder={t("TeamTagPlaceholder")}
                maxLength={5}
              />
            </div>

            <div className="ct-input-group">
              <label className="ct-label">{t("Logo")}</label>
              <div className="ct-logo-section">
                <div className="ct-logo-preview">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt={t("LogoPreview")}
                      className="ct-logo-img"
                    />
                  ) : (
                    <span className="ct-logo-placeholder">{t("NoLogo")}</span>
                  )}
                </div>
                <div className="ct-file-input-wrapper">
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
                        setError(t("UploadImageFailed"));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="ct-file-input"
                  />
                  <p className="ct-help-text">{t("StartUploadLogo")}</p>
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
