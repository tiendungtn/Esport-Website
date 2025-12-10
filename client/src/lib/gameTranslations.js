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

// Tên game được lưu trong DB là Tiếng Việt
// Hàm dịch từ Tiếng Việt (DB) sang ngôn ngữ hiện tại
export const translateGameName = (gameNameFromDB) => {
  if (!gameNameFromDB) return gameNameFromDB;

  const currentLang = i18n.language;

  // Nếu là Tiếng Anh, dịch Việt -> Anh
  if (currentLang === "en") {
    return GAME_NAMES_VI_TO_EN[gameNameFromDB] || gameNameFromDB;
  }

  // Nếu là Tiếng Việt, trả về nguyên gốc
  return gameNameFromDB;
};

// Dịch tên giải đấu bằng cách thay thế tên game và từ thông dụng
export const translateTournamentName = (tournamentName) => {
  if (!tournamentName) return tournamentName;

  const currentLang = i18n.language;
  let translatedName = tournamentName;

  if (currentLang === "en") {
    // 1. Thay thế tên game Vi -> Anh
    Object.entries(GAME_NAMES_VI_TO_EN).forEach(([vi, en]) => {
      if (vi !== en) {
        translatedName = translatedName.replace(new RegExp(vi, "gi"), en);
      }
    });
    // 2. Thay thế từ thông dụng Vi -> Anh
    Object.entries(COMMON_TERMS_VI_TO_EN).forEach(([vi, en]) => {
      translatedName = translatedName.replace(new RegExp(vi, "gi"), en);
    });
  } else {
    // 1. Thay thế tên game Anh -> Vi
    Object.entries(GAME_NAMES_EN_TO_VI).forEach(([en, vi]) => {
      if (en !== vi) {
        translatedName = translatedName.replace(new RegExp(en, "gi"), vi);
      }
    });
    // 2. Thay thế từ thông dụng Anh -> Vi
    Object.entries(COMMON_TERMS_EN_TO_VI).forEach(([en, vi]) => {
      translatedName = translatedName.replace(new RegExp(en, "gi"), vi);
    });
  }

  return translatedName;
};

// Lấy tên tất cả game theo ngôn ngữ hiện tại cho dropdown
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

// Chuyển từ tên hiển thị (Anh hoặc Việt) về Tiếng Việt để lưu DB
export const gameNameToDB = (displayName) => {
  // Nếu là tên Anh, map về Việt
  if (GAME_NAMES_EN_TO_VI[displayName]) {
    return GAME_NAMES_EN_TO_VI[displayName];
  }

  // Ngược lại thì đã là Việt (hoặc custom)
  return displayName;
};
