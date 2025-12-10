import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Header
      Tournaments: "Tournaments",
      Organizer: "Organizer",
      Profile: "Profile",
      SignIn: "Sign in",
      SignOut: "Sign out",

      // Admin Tabs
      TournamentsTab: "Tournaments",
      TeamsTab: "Teams",
      PlayersTab: "Players",
      MatchesTab: "Matches",

      // Home Page
      HUMG_Esports: "HUMG eSports",
      HeroTitle:
        "Manage & Organize eSports Tournaments for Clubs, Classes, and Schools.",
      HeroSubtitle:
        "Create tournaments, register teams, generate Single Elimination brackets, and track live results.",
      CreateTournamentBtn: "+ Create Tournament",
      ViewOpenTournaments: "View Open Tournaments",
      FeaturedTournaments: "Featured Tournaments",
      LoadingTournaments: "Loading tournaments...",
      ErrorLoadingTournaments: "Failed to load tournaments.",
      NoTournaments:
        "No tournaments yet. Be the first to create one in the Admin page.",
      MaxTeams: "Max {{count}} teams",

      // Tournament Status
      StatusOpen: "Register",
      StatusOngoing: "Ongoing",
      StatusFinished: "Finished",
      StatusDraft: "Draft",

      // Admin Tournaments
      ManageTournaments: "Manage Tournaments",
      TableName: "Tournament Name",
      TableGame: "Game",
      TableTeams: "Teams",
      TableStatus: "Status",
      TableActions: "Actions",
      DeleteConfirm: "Are you sure you want to delete this tournament?",
      EditTournament: "Edit Tournament",
      CreateNewTournament: "Create New Tournament",
      FormName: "Tournament Name",
      FormGame: "Game",
      FormMaxTeams: "Max Teams",
      FormDescription: "Description",
      Cancel: "Cancel",
      Save: "Save Changes",
      Saving: "Saving...",

      // Admin Teams
      ManageTeams: "Manage Teams",
      AllGames: "All Games",
      CreateTeam: "Create Team",
      TeamName: "Team Name",
      Tag: "Tag",
      Captain: "Captain",
      Members: "Members",
      ManageMembers: "Manage Members",
      DeleteTeamConfirm: "Are you sure you want to delete this team?",
      EditTeam: "Edit Team",
      CreateNewTeam: "Create New Team",
      TeamTag: "Tag (Abbreviation)",
      LogoURL: "Logo URL",
      TeamMembers: "Team Members:",
      SearchUserPlaceholder: "Search user by email or name...",
      Search: "Search",
      SearchResults: "Search Results:",
      Add: "Add",
      MemberList: "Member List",
      NoMembers: "No members yet",
      Remove: "Remove",
      Close: "Close",
      AddMemberError: "Error adding member",

      // Admin Players
      ManagePlayers: "Manage Players",
      SearchPlayerPlaceholder: "Search players...",
      DisplayName: "Display Name",
      Email: "Email",
      Role: "Role",
      JoinDate: "Join Date",

      // Admin Matches
      ManageMatches: "Manage Matches",
      SelectTournament: "Select tournament...",
      Round: "Round",
      Team1: "Team 1",
      Score: "Score",
      Team2: "Team 2",
      NoMatches: "No matches yet. Create schedule in tournament management.",
      PleaseSelectTournament: "Please select a tournament to view matches",
      UpdateScore: "Update Score",
      Proof: "Proof (Image/Link)",
      UploadImage: "Upload Image",
      Uploading: "Uploading...",
      OrPasteLink: "Or paste image link...",
      Updating: "Updating...",
      UpdateScoreBtn: "Update Score",
      ConfirmResult: "Confirm Result (End Match)",
      UploadFailed: "Upload failed",
      Error_SCORE_LIMIT_EXCEEDED:
        "Score cannot exceed {{max}} for a Best of {{bestOf}} match.",
      Error_MATCH_FINALIZED: "Cannot update a finalized match.",
      Error_CONFIRM_WINS_NEEDED:
        "Match cannot be finished. Requires {{needed}} wins (Best of {{bestOf}}).",

      // Tournament Page
      LoadingTournament: "Loading tournament...",
      TournamentNotFound: "Tournament not found.",
      TournamentDescription:
        "eSports tournament managed by HUMG Esports system.",
      RegisterToJoin: "Register to Join",
      BracketSE: "Single Elimination Bracket",
      LoadingMatches: "Loading matches...",
      ErrorLoadingMatches: "Failed to load matches.",

      // Profile Page
      ProfileManagement: "Profile Management",
      LoadingProfile: "Loading profile...",
      User: "User",
      AvatarURL: "Avatar URL",
      PhoneNumber: "Phone Number",
      SaveChanges: "Save Changes",
      ProfileUpdatedSuccess: "Profile updated successfully",
      FailedToUpdateProfile: "Failed to update profile",
      EnterDisplayName: "Enter your display name",
      EnterAvatarURL: "https://example.com/avatar.jpg",
      EnterPhoneNumber: "Enter your phone number",

      // Login / Register
      SignInTitle: "Sign in",
      CreateAccount: "Create account",
      ForgotPasswordTitle: "Forgot password",
      DisplayNamePlaceholder: "Display name for tournaments",
      EmailPlaceholder: "you@example.com",
      PasswordPlaceholder: "••••••••",
      ForgotPasswordQuestion: "Forgot password?",
      LoggingIn: "Logging in...",
      CreatingAccount: "Creating account...",
      Sending: "Sending...",
      SendResetLink: "Send reset link (demo)",
      BackToLogin: "Back to Login",
      LoginSuccess: "Login successful!",
      RegisterSuccess: "Account created & logged in successfully!",
      ForgotDemoMessage:
        "Demo: simulate sending password reset email (backend not implemented).",
      GenericError: "An error occurred. Please try again.",
      PasswordLabel: "Password",
    },
  },
  vi: {
    translation: {
      // Header
      Tournaments: "Giải đấu",
      Organizer: "Ban tổ chức",
      Profile: "Hồ sơ",
      SignIn: "Đăng nhập",
      SignOut: "Đăng xuất",

      // Admin Tabs
      TournamentsTab: "Giải đấu",
      TeamsTab: "Đội tuyển",
      PlayersTab: "Tuyển thủ",
      MatchesTab: "Lịch thi đấu",

      // Home Page
      HUMG_Esports: "HUMG eSports",
      HeroTitle: "Quản lý & tổ chức giải đấu eSports cho CLB, lớp và trường.",
      HeroSubtitle:
        "Tạo giải đấu, đăng ký đội, sinh bracket Single Elimination và theo dõi kết quả trực tuyến.",
      CreateTournamentBtn: "+ Tạo giải đấu",
      ViewOpenTournaments: "Xem các giải đang mở",
      FeaturedTournaments: "Giải đấu nổi bật",
      LoadingTournaments: "Đang tải danh sách giải...",
      ErrorLoadingTournaments: "Không tải được danh sách giải đấu.",
      NoTournaments:
        "Chưa có giải nào. Hãy là người đầu tiên tạo giải ở trang Admin.",
      MaxTeams: "Tối đa {{count}} đội",

      // Tournament Status
      StatusOpen: "Đăng ký",
      StatusOngoing: "Đang diễn ra",
      StatusFinished: "Đã kết thúc",
      StatusDraft: "Nháp",

      // Admin Tournaments
      ManageTournaments: "Quản lý Giải đấu",
      TableName: "Tên giải",
      TableGame: "Game",
      TableTeams: "Số đội",
      TableStatus: "Trạng thái",
      TableActions: "Hành động",
      DeleteConfirm: "Bạn có chắc chắn muốn xóa giải đấu này?",
      EditTournament: "Chỉnh sửa giải đấu",
      CreateNewTournament: "Tạo giải đấu mới",
      FormName: "Tên giải đấu",
      FormGame: "Game",
      FormMaxTeams: "Số đội tối đa",
      FormDescription: "Mô tả",
      Cancel: "Hủy",
      Save: "Lưu thay đổi",
      Saving: "Đang lưu...",

      // Admin Teams
      ManageTeams: "Quản lý Đội tuyển",
      AllGames: "Tất cả game",
      CreateTeam: "Tạo đội mới",
      TeamName: "Tên đội",
      Tag: "Tag",
      Captain: "Đội trưởng",
      Members: "Thành viên",
      ManageMembers: "Quản lý thành viên",
      DeleteTeamConfirm: "Bạn có chắc chắn muốn xóa đội này?",
      EditTeam: "Chỉnh sửa đội tuyển",
      CreateNewTeam: "Tạo đội tuyển mới",
      TeamTag: "Tag (Viết tắt)",
      LogoURL: "Logo URL",
      TeamMembers: "Thành viên đội:",
      SearchUserPlaceholder: "Tìm kiếm user bằng email hoặc tên...",
      Search: "Tìm",
      SearchResults: "Kết quả tìm kiếm:",
      Add: "Thêm",
      MemberList: "Danh sách thành viên",
      NoMembers: "Chưa có thành viên nào",
      Remove: "Xóa",
      Close: "Đóng",
      AddMemberError: "Lỗi thêm thành viên",

      // Admin Players
      ManagePlayers: "Quản lý Tuyển thủ",
      SearchPlayerPlaceholder: "Tìm kiếm tuyển thủ...",
      DisplayName: "Tên hiển thị",
      Email: "Email",
      Role: "Vai trò",
      JoinDate: "Ngày tham gia",

      // Admin Matches
      ManageMatches: "Quản lý Lịch thi đấu",
      SelectTournament: "Chọn giải đấu...",
      Round: "Vòng",
      Team1: "Đội 1",
      Score: "Tỉ số",
      Team2: "Đội 2",
      NoMatches:
        "Chưa có trận đấu nào. Hãy tạo lịch thi đấu trong phần quản lý giải đấu.",
      PleaseSelectTournament: "Vui lòng chọn một giải đấu để xem lịch thi đấu",
      UpdateScore: "Cập nhật tỉ số",
      Proof: "Minh chứng (Ảnh/Link)",
      UploadImage: "Tải ảnh lên",
      Uploading: "Đang tải...",
      OrPasteLink: "Hoặc dán link ảnh...",
      Updating: "Đang cập nhật...",
      UpdateScoreBtn: "Cập nhật tỉ số",
      ConfirmResult: "Xác nhận kết quả (Kết thúc trận)",
      UploadFailed: "Upload thất bại",
      Error_SCORE_LIMIT_EXCEEDED:
        "Tỉ số không được quá {{max}} trong trận BO{{bestOf}}.",
      Error_MATCH_FINALIZED: "Không thể cập nhật trận đấu đã kết thúc.",
      Error_CONFIRM_WINS_NEEDED:
        "Chưa đủ điều kiện kết thúc. Cần thắng {{needed}} ván (BO{{bestOf}}).",

      // Tournament Page
      LoadingTournament: "Đang tải giải đấu...",
      TournamentNotFound: "Không tìm thấy giải đấu này.",
      TournamentDescription:
        "Giải đấu eSports được quản lý bởi hệ thống HUMG Esports.",
      RegisterToJoin: "Đăng ký tham gia",
      BracketSE: "Bảng đấu loại trực tiếp",
      LoadingMatches: "Đang tải lịch thi đấu...",
      ErrorLoadingMatches: "Không thể tải lịch thi đấu.",

      // Profile Page
      ProfileManagement: "Quản lý Hồ sơ",
      LoadingProfile: "Đang tải hồ sơ...",
      User: "Người dùng",
      AvatarURL: "Link ảnh đại diện",
      PhoneNumber: "Số điện thoại",
      SaveChanges: "Lưu thay đổi",
      ProfileUpdatedSuccess: "Cập nhật hồ sơ thành công",
      FailedToUpdateProfile: "Không thể cập nhật hồ sơ",
      EnterDisplayName: "Nhập tên hiển thị của bạn",
      EnterAvatarURL: "https://example.com/avatar.jpg",
      EnterPhoneNumber: "Nhập số điện thoại của bạn",

      // Login / Register
      SignInTitle: "Đăng nhập",
      CreateAccount: "Tạo tài khoản",
      ForgotPasswordTitle: "Quên mật khẩu",
      DisplayNamePlaceholder: "Tên hiển thị trong giải",
      EmailPlaceholder: "you@example.com",
      PasswordPlaceholder: "••••••••",
      ForgotPasswordQuestion: "Quên mật khẩu?",
      LoggingIn: "Đang đăng nhập...",
      CreatingAccount: "Đang tạo tài khoản...",
      Sending: "Đang gửi...",
      SendResetLink: "Gửi link khôi phục (demo)",
      BackToLogin: "Quay lại đăng nhập",
      LoginSuccess: "Đăng nhập thành công!",
      RegisterSuccess: "Tạo tài khoản & đăng nhập thành công!",
      ForgotDemoMessage:
        "Demo: giả lập gửi email đặt lại mật khẩu (không triển khai backend).",
      GenericError: "Đã có lỗi xảy ra. Vui lòng kiểm tra lại.",
      PasswordLabel: "Mật khẩu",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "vi",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
