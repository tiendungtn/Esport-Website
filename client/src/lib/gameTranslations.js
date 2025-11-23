import i18n from "../i18n";

// Game names are STORED in database in Vietnamese
// This function translates from Vietnamese (database) to current language
export const translateGameName = (gameNameFromDB) => {
  if (!gameNameFromDB) return gameNameFromDB;

  const currentLang = i18n.language;

  // If current language is English, translate Vietnamese -> English
  if (currentLang === "en") {
    const mapping = {
      "Liên Minh Huyền Thoại": "League of Legends",
      "Tốc Chiến": "Wild Rift",
      "Liên Quân": "Arena of Valor",
      Valorant: "Valorant",
      CS2: "CS2",
      "FC Online": "FC Online",
    };
    return mapping[gameNameFromDB] || gameNameFromDB;
  }

  // If Vietnamese, return as-is (already in Vietnamese)
  return gameNameFromDB;
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
  const reverseMapping = {
    "League of Legends": "Liên Minh Huyền Thoại",
    "Wild Rift": "Tốc Chiến",
    "Arena of Valor": "Liên Quân",
    Valorant: "Valorant",
    CS2: "CS2",
    "FC Online": "FC Online",
  };

  // If it's already in Vietnamese, return as-is
  if (reverseMapping[displayName]) {
    return reverseMapping[displayName];
  }

  // Otherwise it's already Vietnamese
  return displayName;
};
