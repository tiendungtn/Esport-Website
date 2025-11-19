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
          kết quả trực tuyến – giao diện gọn, dễ dùng giống start.gg.
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

      <section id="tournaments" className="space-y-3">
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

        {!isLoading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((t) => (
              <Link
                key={t._id}
                to={`/t/${t._id}`}
                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70 shadow transition-all hover:border-sky-500/60 hover:shadow-sky-500/20"
              >
                <div className="h-24 bg-gradient-to-r from-sky-500/20 via-slate-800 to-fuchsia-500/20" />
                <div className="space-y-2 px-4 pb-4 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-50 group-hover:text-sky-300">
                      {t.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClassForStatus(
                        t.status
                      )}`}
                    >
                      {labelForStatus(t.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t.game} • Tối đa {t.maxTeams} đội
                  </p>
                  <p className="line-clamp-2 text-xs text-slate-400">
                    {t.description || "Giải đấu eSports cho câu lạc bộ / lớp."}
                  </p>
                </div>
              </Link>
            ))}
            {data?.length === 0 && (
              <p className="col-span-full text-sm text-slate-400">
                Chưa có giải nào. Hãy là người đầu tiên tạo giải ở trang Admin.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function labelForStatus(status) {
  switch (status) {
    case "open":
      return "Đang mở đăng ký";
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
      return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
    case "ongoing":
      return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
    case "finished":
      return "bg-slate-700/60 text-slate-100 border border-slate-500/60";
    default:
      return "bg-slate-800 text-slate-200 border border-slate-700";
  }
}
