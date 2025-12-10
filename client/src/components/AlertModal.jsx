import React from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-sm rounded-lg border p-6 shadow-xl bg-slate-950 ${getColorClass()}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-slate-100">
              {title || t("Error")}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-300">{message}</p>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
