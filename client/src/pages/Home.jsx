import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-xl md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-400">
          HUMG eSports
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-50 md:text-4xl">
          Quản lý & tổ chức giải đấu eSports cho CLB, lớp và trường.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
          Tạo giải đấu, đăng ký đội, sinh bracket Single Elimination và theo dõi
          kết quả trực tuyến.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/admin"
            className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            + Tạo giải đấu
          </Link>
          <a
            href="#tournaments"
            className="inline-flex items-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-slate-500"
          >
            Xem các giải đang mở
          </a>
        </div>
      </section>

      <section id="tournaments" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            Giải đấu nổi bật
          </h2>
        </div>

        {isLoading && (
          <p className="text-sm text-slate-400">Đang tải danh sách giải...</p>
        )}
        {error && (
          <p className="text-sm text-red-400">
            Không tải được danh sách giải đấu.
          </p>
        )}

        {!isLoading && !error && data?.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((t) => {
              const theme = getGameTheme(t.game);
              return (
                <Link
                  key={t._id}
                  to={`/t/${t.slug || t._id}`}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br min-h-[200px] ${theme.from} ${theme.to}`}
                >
                  {/* Background Image/Banner */}
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                    <img
                      src={getGameImage(t.game)}
                      alt={t.game}
                      className="h-full w-full object-cover grayscale transition-all group-hover:grayscale-0"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative flex flex-col justify-between p-6 h-full">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-xl font-bold text-white drop-shadow-md leading-tight">
                          {t.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 shadow-sm backdrop-blur-md ${badgeClassForStatus(
                            t.status
                          )}`}
                        >
                          {labelForStatus(t.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-bold text-white/90 uppercase tracking-wide">
                        {t.game}
                      </p>
                      <p className="text-xs font-medium text-white/70">
                        Tối đa {t.maxTeams} đội
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && !error && data?.length === 0 && (
          <p className="text-sm text-slate-400">
            Chưa có giải nào. Hãy là người đầu tiên tạo giải ở trang Admin.
          </p>
        )}
      </section>
    </div>
  );
}

function labelForStatus(status) {
  switch (status) {
    case "open":
      return "Đăng ký";
    case "ongoing":
      return "Đang diễn ra";
    case "finished":
      return "Đã kết thúc";
    default:
      return "Nháp";
  }
}

function badgeClassForStatus(status) {
  switch (status) {
    case "open":
      return "bg-slate-900/80 text-white border border-white/10 hover:bg-slate-800";
    case "ongoing":
      return "bg-sky-500/20 text-sky-100 border border-sky-500/30";
    case "finished":
      return "bg-slate-500/20 text-slate-200 border border-slate-500/30";
    default:
      return "bg-white/10 text-white border border-white/20";
  }
}

import cs2Banner from "../img/CS2-banner.png";
import valorantBanner from "../img/Valorant-banner.png";
import aovBanner from "../img/Lien-quan-banner.png";
import wildRiftBanner from "../img/Toc-chien-banner.png";
import lolBanner from "../img/Lien-minh-huyen-thoai-banner.png";

function getGameImage(game) {
  const map = {
    CS2: cs2Banner,
    VALORANT: valorantBanner,
    Valorant: valorantBanner,
    "Arena of Valor": aovBanner,
    "Liên Quân": aovBanner,
    "Wild Rift": wildRiftBanner,
    "Tốc Chiến": wildRiftBanner,
    "League of Legends": lolBanner,
    "Liên Minh Huyền Thoại": lolBanner,
    "FC Online": "https://placehold.co/600x400?text=FC+Online",
  };
  return map[game] || "https://placehold.co/600x400?text=Esports";
}

function getGameTheme(game) {
  const themes = {
    CS2: { from: "from-slate-900", to: "to-blue-900" },
    "CS:GO": { from: "from-slate-900", to: "to-blue-900" },
    VALORANT: { from: "from-orange-600", to: "to-red-600" },
    Valorant: { from: "from-orange-600", to: "to-red-600" },
    "League of Legends": { from: "from-yellow-700", to: "to-yellow-900" },
    "Liên Minh Huyền Thoại": { from: "from-yellow-700", to: "to-yellow-900" },
    "Dota 2": { from: "from-red-900", to: "to-slate-900" },
    PUBG: { from: "from-amber-500", to: "to-yellow-600" },
    "Mobile Legends": { from: "from-blue-600", to: "to-indigo-700" },
    "Arena of Valor": { from: "from-teal-600", to: "to-cyan-700" },
    "Liên Quân": { from: "from-teal-600", to: "to-cyan-700" },
    "Free Fire": { from: "from-orange-500", to: "to-amber-600" },
    TFT: { from: "from-sky-600", to: "to-blue-700" },
    "FC Online": { from: "from-emerald-600", to: "to-green-700" },
    "Wild Rift": { from: "from-purple-700", to: "to-indigo-900" },
    "Tốc Chiến": { from: "from-purple-700", to: "to-indigo-900" },
  };
  return themes[game] || { from: "from-slate-800", to: "to-slate-900" };
}
