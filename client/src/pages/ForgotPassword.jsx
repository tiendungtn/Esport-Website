import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/pages/forgot-password.css";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fp-container">
      <div className="fp-card">
        <h1 className="fp-title">{t("ForgotPasswordTitle")}</h1>
        <p className="fp-description">{t("ForgotDemoMessage")}</p>

        {submitted ? (
          <p className="fp-success">{t("ForgotPasswordSent")}</p>
        ) : (
          <form onSubmit={onSubmit} className="fp-form">
            <label className="fp-label">
              <span className="fp-label-text">{t("Email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fp-input"
                placeholder={t("EmailPlaceholder")}
              />
            </label>
            <button type="submit" className="fp-submit-btn">
              {t("SendResetLink")}
            </button>
          </form>
        )}

        <div className="fp-back-container">
          <Link to="/login" className="fp-back-link">
            ← {t("BackToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
