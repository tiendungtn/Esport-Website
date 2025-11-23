import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => changeLanguage("vi")}
        className={`px-2 py-1 rounded ${
          i18n.language === "vi"
            ? "bg-sky-500 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        VI
      </button>
      <span className="text-slate-600">|</span>
      <button
        onClick={() => changeLanguage("en")}
        className={`px-2 py-1 rounded ${
          i18n.language === "en"
            ? "bg-sky-500 text-white"
            : "text-slate-400 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
