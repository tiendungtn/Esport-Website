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

  return (
    <div className="alert-modal-overlay">
      <div
        className={`alert-modal-content ${
          type === "danger"
            ? "alert-modal-danger"
            : type === "warning"
            ? "alert-modal-warning"
            : "alert-modal-info"
        }`}
      >
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

        <div className="alert-modal-footer">
          <button
            onClick={onClose}
            className="alert-modal-btn-cancel"
            disabled={isLoading}
          >
            {cancelText || t("Cancel")}
          </button>
          <button
            onClick={onConfirm}
            className={`alert-modal-btn-confirm ${
              type === "danger"
                ? "alert-modal-btn-danger"
                : "alert-modal-btn-warning"
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
