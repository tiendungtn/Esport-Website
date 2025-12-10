import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Link,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Home from "./pages/Home.jsx";
import Tournament from "./pages/Tournament.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import LoginModal from "./pages/LoginModal.jsx";
import Profile from "./pages/Profile.jsx";
import PublicTeamProfile from "./pages/PublicTeamProfile.jsx";
import CreateTeam from "./pages/CreateTeam.jsx";
import humgLogo from "./img/icon-humg.png";
import "./styles/components/shell-layout.css";

import { Menu, X } from "lucide-react";

function ShellLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const openLoginModal = () => {
    navigate("/login", {
      state: { backgroundLocation: location },
    });
  };

  return (
    <div className="shell-container">
      <header className="shell-header">
        <div className="shell-header-content">
          <div className="shell-nav-wrapper">
            {/* Mobile Menu Toggle */}
            <button
              className="shell-mobile-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link to="/" className="shell-logo-link">
              <img src={humgLogo} alt="HUMG" className="shell-logo-img" />
              <span>HUMG eSports</span>
            </Link>
            <nav className="shell-desktop-nav">
              <Link to="/" className="shell-nav-link">
                {t("Tournaments")}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="shell-nav-link">
                  {t("Organizer")}
                </Link>
              )}
            </nav>
          </div>

          <div className="shell-user-actions">
            <div className="shell-desktop-actions">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="shell-profile-link">
                    {user?.displayName || t("Profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="shell-signout-btn"
                  >
                    {t("SignOut")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="shell-signin-btn"
                >
                  {t("SignIn")}
                </button>
              )}
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="shell-mobile-menu">
            <nav className="shell-mobile-nav">
              <Link to="/" className="shell-nav-link">
                {t("Tournaments")}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="shell-nav-link">
                  {t("Organizer")}
                </Link>
              )}
              <hr className="shell-mobile-hr" />
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="shell-nav-link">
                    {user?.displayName || t("Profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="shell-mobile-signout"
                  >
                    {t("SignOut")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="shell-mobile-signin"
                >
                  {t("SignIn")}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state;
  const backgroundLocation = state && state.backgroundLocation;

  return (
    <>
      {/* Routes nền (không popup) */}
      <Routes location={backgroundLocation || location}>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/t/:id" element={<Tournament />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/teams/:id" element={<PublicTeamProfile />} />
          <Route path="/teams/create" element={<CreateTeam />} />
        </Route>
      </Routes>

      {/* Popup login khi có backgroundLocation */}
      {backgroundLocation && (
        <Routes>
          <Route
            path="/login"
            element={<LoginModal open={true} onClose={() => navigate(-1)} />}
          />
        </Routes>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
