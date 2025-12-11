import React from "react";
import { X, AlertTriangle, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../styles/components/alert-modal.css"; // Reuse alert modal styles

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "warning",
  isLoading = false,
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <HelpCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-500/10 border-red-500/20";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20";
      default:
        return "bg-slate-800 border-slate-700";
    }
  };

  return (
    <div className="alert-modal-overlay">
      <div className={`alert-modal-content ${getColorClass()}`}>
        <div className="alert-modal-header">
          <div className="alert-modal-title-container">
            {getIcon()}
            <h3 className="alert-modal-title">{title || t("Confirm")}</h3>
          </div>
          <button
            onClick={onClose}
            className="alert-modal-close-btn"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <p className="alert-modal-message">{message}</p>

        <div className="alert-modal-footer flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            {cancelText || t("Cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              type === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-sky-500 hover:bg-sky-600 text-white"
            }`}
            disabled={isLoading}
          >
            {isLoading ? t("Processing") : confirmText || t("Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
