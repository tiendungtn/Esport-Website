import React from "react";
import { X } from "lucide-react";
import Modal from "../components/Model.jsx";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 text-[13px] font-medium text-slate-200">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-700 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
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
        // Use context login instead of direct localStorage
        login(res.data.accessToken, res.data.user);

        setInfo(t("LoginSuccess"));
        setTimeout(() => {
          onClose?.();
          // No need to reload, context will update state
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
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
        <div className="text-sm font-semibold text-slate-100">
          {mode === "login" && t("SignInTitle")}
          {mode === "register" && t("CreateAccount")}
          {mode === "forgot" && t("ForgotPasswordTitle")}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pb-5 pt-4">
        {/* Tabs Login / Sign up */}
        {mode !== "forgot" && (
          <div className="mb-4 inline-flex rounded-full border border-slate-700 bg-slate-900 p-1 text-xs">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-full px-3 py-1 ${
                mode === "login"
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              {t("SignInTitle")}
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-full px-3 py-1 ${
                mode === "register"
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              {t("CreateAccount")}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-end text-xs">
              <button
                type="button"
                className="text-sky-400 hover:text-sky-300"
                onClick={() => switchMode("forgot")}
              >
                {t("ForgotPasswordQuestion")}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {mode === "login" && (loading ? t("LoggingIn") : t("SignInTitle"))}
            {mode === "register" &&
              (loading ? t("CreatingAccount") : t("CreateAccount"))}
            {mode === "forgot" && (loading ? t("Sending") : t("SendResetLink"))}
          </button>
        </form>

        {mode === "forgot" && (
          <div className="mt-4 text-xs text-slate-400">
            <button
              type="button"
              className="text-sky-400 underline hover:text-sky-300"
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
