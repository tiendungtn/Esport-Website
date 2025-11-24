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
import humgLogo from "./img/icon-humg.png";

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              className="text-slate-300 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-semibold text-slate-50"
            >
              <img src={humgLogo} alt="HUMG" className="h-7 w-7 rounded-md" />
              <span>HUMG eSports</span>
            </Link>
            <nav className="hidden items-center gap-4 text-xs text-slate-300 md:flex">
              <Link to="/" className="hover:text-sky-300">
                {t("Tournaments")}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hover:text-sky-300">
                  {t("Organizer")}
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="text-xs font-medium text-slate-300 hover:text-sky-300"
                  >
                    {user?.displayName || t("Profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-red-500 hover:text-red-300"
                  >
                    {t("SignOut")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300"
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
          <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4 text-sm text-slate-300">
              <Link to="/" className="hover:text-sky-300">
                {t("Tournaments")}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hover:text-sky-300">
                  {t("Organizer")}
                </Link>
              )}
              <hr className="border-slate-800" />
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="hover:text-sky-300">
                    {user?.displayName || t("Profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-left text-red-400 hover:text-red-300"
                  >
                    {t("SignOut")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="text-left text-sky-400 hover:text-sky-300"
                >
                  {t("SignIn")}
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
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
