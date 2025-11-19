import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Link,
  Outlet,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Tournament from "./pages/Tournament.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import LoginModal from "./pages/LoginModal.jsx";

function ShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();

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
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-semibold text-slate-50"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-xs font-bold text-slate-950">
                ES
              </span>
              <span>HUMG eSports</span>
            </Link>
            <nav className="hidden items-center gap-4 text-xs text-slate-300 md:flex">
              <Link to="/" className="hover:text-sky-300">
                Tournaments
              </Link>
              <Link to="/admin" className="hover:text-sky-300">
                Organizer
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openLoginModal}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-sky-500 hover:text-sky-300"
            >
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
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
