import React from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../styles/components/alert-modal.css";

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "error",
}) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case "success":
        return "bg-green-500/10 border-green-500/20";
      case "error":
        return "bg-red-500/10 border-red-500/20";
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
            <h3 className="alert-modal-title">{title || t("Error")}</h3>
          </div>
          <button onClick={onClose} className="alert-modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <p className="alert-modal-message">{message}</p>

        <div className="alert-modal-footer">
          <button onClick={onClose} className="alert-modal-button">
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
