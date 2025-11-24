import i18n from "../i18n";

export const GAME_NAMES_VI_TO_EN = {
  "Liên Minh Huyền Thoại": "League of Legends",
  "Tốc Chiến": "Wild Rift",
  "Liên Quân": "Arena of Valor",
  Valorant: "Valorant",
  CS2: "CS2",
  "FC Online": "FC Online",
};

export const GAME_NAMES_EN_TO_VI = {
  "League of Legends": "Liên Minh Huyền Thoại",
  "Wild Rift": "Tốc Chiến",
  "Arena of Valor": "Liên Quân",
  Valorant: "Valorant",
  CS2: "CS2",
  "FC Online": "FC Online",
};

export const COMMON_TERMS_EN_TO_VI = {
  Championship: "Giải Vô Địch",
  Tournament: "Giải Đấu",
  Cup: "Cúp",
  League: "Giải",
  Series: "Series",
  Invitational: "Giải Mời",
};

export const COMMON_TERMS_VI_TO_EN = {
  "Giải Vô Địch": "Championship",
  "Giải Đấu": "Tournament",
  Cúp: "Cup",
  Giải: "League",
  "Giải Mời": "Invitational",
};

// Game names are STORED in database in Vietnamese
// This function translates from Vietnamese (database) to current language
export const translateGameName = (gameNameFromDB) => {
  if (!gameNameFromDB) return gameNameFromDB;

  const currentLang = i18n.language;

  // If current language is English, translate Vietnamese -> English
  if (currentLang === "en") {
    return GAME_NAMES_VI_TO_EN[gameNameFromDB] || gameNameFromDB;
  }

  // If Vietnamese, return as-is (already in Vietnamese)
  return gameNameFromDB;
};

// Translate tournament name by replacing game names and common terms
export const translateTournamentName = (tournamentName) => {
  if (!tournamentName) return tournamentName;

  const currentLang = i18n.language;
  let translatedName = tournamentName;

  if (currentLang === "en") {
    // 1. Replace Vietnamese game names with English
    Object.entries(GAME_NAMES_VI_TO_EN).forEach(([vi, en]) => {
      if (vi !== en) {
        translatedName = translatedName.replace(new RegExp(vi, "gi"), en);
      }
    });
    // 2. Replace Vietnamese common terms with English
    Object.entries(COMMON_TERMS_VI_TO_EN).forEach(([vi, en]) => {
      translatedName = translatedName.replace(new RegExp(vi, "gi"), en);
    });
  } else {
    // 1. Replace English game names with Vietnamese
    Object.entries(GAME_NAMES_EN_TO_VI).forEach(([en, vi]) => {
      if (en !== vi) {
        translatedName = translatedName.replace(new RegExp(en, "gi"), vi);
      }
    });
    // 2. Replace English common terms with Vietnamese
    Object.entries(COMMON_TERMS_EN_TO_VI).forEach(([en, vi]) => {
      translatedName = translatedName.replace(new RegExp(en, "gi"), vi);
    });
  }

  return translatedName;
};

// Get all game names in current language for dropdowns/selects
export const getGameNames = () => {
  const currentLang = i18n.language;

  if (currentLang === "en") {
    return [
      "League of Legends",
      "Wild Rift",
      "Arena of Valor",
      "Valorant",
      "CS2",
      "FC Online",
    ];
  } else {
    return [
      "Liên Minh Huyền Thoại",
      "Tốc Chiến",
      "Liên Quân",
      "Valorant",
      "CS2",
      "FC Online",
    ];
  }
};

// Convert from display name (could be EN or VI) back to Vietnamese for saving to DB
export const gameNameToDB = (displayName) => {
  // If it's an English name, map to Vietnamese
  if (GAME_NAMES_EN_TO_VI[displayName]) {
    return GAME_NAMES_EN_TO_VI[displayName];
  }

  // Otherwise it's already Vietnamese (or invalid/custom)
  return displayName;
};
