import React from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      <header className="border-b border-white/10 bg-[#0b0f14]/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-6 py-4 px-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sky-400 font-semibold"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/50">
              🏆
            </span>
            Startify
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-slate-300">
            <NavLink to="/" end className="hover:text-white">
              Home
            </NavLink>
            <a className="hover:text-white" href="#">
              Trending
            </a>
            <a className="hover:text-white" href="#">
              Games
            </a>
            <a className="hover:text-white" href="#">
              Regions
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3 w-full md:w-auto">
            <div className="relative hidden md:block">
              <input
                className="rounded-xl bg-white/5 text-slate-200 placeholder:text-slate-400 border border-white/10 px-4 py-2.5 outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Search tournaments, players…"
              />
            </div>

            {/* 👉 mở modal login với backgroundLocation */}
            <button
              className="rounded-xl border border-white/15 px-4 py-2.5 text-slate-200 hover:bg-white/10"
              onClick={() =>
                navigate("/login", { state: { backgroundLocation: location } })
              }
            >
              Sign in
            </button>

            <button className="rounded-xl bg-sky-500 px-4 py-2.5 text-black font-semibold hover:bg-sky-400">
              Create Tournament
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[60vh]">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 px-4 text-slate-300">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/50">
                🏆
              </span>
              Startify
            </div>
            <p className="mt-2 text-slate-400">
              A clean, start.gg-inspired tournament UI scaffold ready to connect
              to your API.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white">Explore</div>
            <ul className="mt-2 space-y-1">
              <li>Tournaments</li>
              <li>Players</li>
              <li>Rankings</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Developers</div>
            <ul className="mt-2 space-y-1">
              <li>API Docs</li>
              <li>Webhooks</li>
              <li>Status</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Legal</div>
            <ul className="mt-2 space-y-1">
              <li>Terms</li>
              <li>Privacy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
