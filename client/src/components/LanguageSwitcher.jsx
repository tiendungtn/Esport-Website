import React from "react";
import { useTranslation } from "react-i18next";
import "../styles/components/language-switcher.css";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="ls-container">
      <button
        onClick={() => changeLanguage("vi")}
        className={`ls-button ${
          i18n.language === "vi" ? "ls-button-active" : "ls-button-inactive"
        }`}
      >
        VI
      </button>
      <span className="ls-separator">|</span>
      <button
        onClick={() => changeLanguage("en")}
        className={`ls-button ${
          i18n.language === "en" ? "ls-button-active" : "ls-button-inactive"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
