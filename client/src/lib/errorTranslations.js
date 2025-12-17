/**
 * Helper function để dịch thông báo lỗi từ backend sang ngôn ngữ hiện tại
 * @param {string} backendMsg - Thông báo lỗi từ backend (tiếng Anh)
 * @param {function} t - Hàm translate từ i18next
 * @param {string} fallbackKey - Key fallback nếu không tìm thấy bản dịch
 * @returns {string} - Thông báo đã dịch
 */
export function translateBackendError(
  backendMsg,
  t,
  fallbackKey = "GenericError"
) {
  if (!backendMsg) return t(fallbackKey);

  const msg = backendMsg.toLowerCase();

  // Map các error message từ backend sang translation keys
  const errorMappings = [
    { pattern: "invalid payload", key: "BE_InvalidPayload" },
    { pattern: "user not found", key: "BE_UserNotFound" },
    { pattern: "team not found", key: "BE_TeamNotFound" },
    { pattern: "tournament not found", key: "BE_TournamentNotFound" },
    { pattern: "match not found", key: "BE_MatchNotFound" },
    { pattern: "registration not found", key: "BE_RegistrationNotFound" },
    { pattern: "unauthorized", key: "BE_Unauthorized" },
    { pattern: "email already in use", key: "BE_EmailInUse" },
    { pattern: "invalid credentials", key: "BE_InvalidCredentials" },
    { pattern: "invalid status", key: "BE_InvalidStatus" },
    { pattern: "already registered", key: "BE_TeamAlreadyRegistered" },
    { pattern: "registration is closed", key: "BE_RegistrationClosed" },
    { pattern: "maximum teams", key: "BE_MaxTeamsReached" },
    { pattern: "does not match tournament game", key: "BE_GameMismatch" },
    { pattern: "only the team captain", key: "BE_OnlyCaptainCanRegister" },
    { pattern: "already a member", key: "BE_MemberAlreadyInTeam" },
    { pattern: "invalid date", key: "BE_InvalidDate" },
    { pattern: "no winner determined", key: "BE_NoWinnerDetermined" },
    // Registration errors
    { pattern: "must have at least", key: "BE_MinMembersRequired" },
    { pattern: "at least", key: "BE_MinMembersRequired" },
    { pattern: "schedule conflict", key: "Error_SCHEDULE_CONFLICT" },
    { pattern: "cannot approve", key: "Error_APPROVAL_SCHEDULE_CONFLICT" },
    // Bracket generation errors
    { pattern: "pending registrations", key: "Error_PendingRegistrations" },
    { pattern: "already exists", key: "Error_BracketExists" },
    { pattern: "not enough teams", key: "Error_NotEnoughTeams" },
  ];

  for (const mapping of errorMappings) {
    if (msg.includes(mapping.pattern)) {
      return t(mapping.key);
    }
  }

  // Fallback: return original message if available, otherwise use fallback key
  return backendMsg || t(fallbackKey);
}
