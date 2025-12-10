import React from "react";
import { X } from "lucide-react";
import Modal from "../components/Model.jsx";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import "../styles/pages/login.css";

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="field-label">
      <div className="field-text">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </label>
  );
}

export default function LoginModal({ open = false, onClose }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [mode, setMode] = React.useState("login"); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      setLoading(true);
      if (mode === "login") {
        const res = await api.post("/api/auth/login", { email, password });
        // Sử dụng context login thay vì localStorage trực tiếp
        login(res.data.accessToken, res.data.user);

        setInfo(t("LoginSuccess"));
        setTimeout(() => {
          onClose?.();
          // Không cần reload, context sẽ cập nhật state
        }, 400);
      } else if (mode === "register") {
        const res = await api.post("/api/auth/register", {
          email,
          password,
          displayName: displayName || email.split("@")[0],
        });
        login(res.data.accessToken, res.data.user);

        setInfo(t("RegisterSuccess"));
        setTimeout(() => {
          onClose?.();
        }, 400);
      } else if (mode === "forgot") {
        setInfo(t("ForgotDemoMessage"));
      }
    } catch (err) {
      setError(err?.response?.data?.message || t("GenericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="lm-header">
        <div className="lm-title">
          {mode === "login" && t("SignInTitle")}
          {mode === "register" && t("CreateAccount")}
          {mode === "forgot" && t("ForgotPasswordTitle")}
        </div>
        <button type="button" onClick={onClose} className="lm-close-btn">
          <X size={18} />
        </button>
      </div>

      <div className="lm-body">
        {/* Tabs Login / Sign up */}
        {mode !== "forgot" && (
          <div className="lm-tabs">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`lm-tab-btn ${
                mode === "login" ? "lm-tab-active" : "lm-tab-inactive"
              }`}
            >
              {t("SignInTitle")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`lm-tab-btn ${
                mode === "register" ? "lm-tab-active" : "lm-tab-inactive"
              }`}
            >
              {t("CreateAccount")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="lm-form">
          {mode === "register" && (
            <Field
              label={t("DisplayName")}
              value={displayName}
              onChange={setDisplayName}
              placeholder={t("DisplayNamePlaceholder")}
            />
          )}
          <Field
            label={t("Email")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("EmailPlaceholder")}
          />
          {(mode === "login" || mode === "register") && (
            <Field
              label={t("PasswordLabel")}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t("PasswordPlaceholder")}
            />
          )}

          {mode === "login" && (
            <div className="lm-forgot-container">
              <button
                type="button"
                className="lm-forgot-link"
                onClick={() => switchMode("forgot")}
              >
                {t("ForgotPasswordQuestion")}
              </button>
            </div>
          )}

          {error && <p className="lm-error">{error}</p>}
          {info && <p className="lm-info">{info}</p>}

          <button type="submit" disabled={loading} className="lm-submit-btn">
            {mode === "login" && (loading ? t("LoggingIn") : t("SignInTitle"))}
            {mode === "register" &&
              (loading ? t("CreatingAccount") : t("CreateAccount"))}
            {mode === "forgot" && (loading ? t("Sending") : t("SendResetLink"))}
          </button>
        </form>

        {mode === "forgot" && (
          <div className="lm-back-container">
            <button
              type="button"
              className="lm-back-link"
              onClick={() => switchMode("login")}
            >
              ← {t("BackToLogin")}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
