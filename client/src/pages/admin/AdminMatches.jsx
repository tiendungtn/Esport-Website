import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Edit, CheckCircle } from "lucide-react";

export default function AdminMatches() {
  const [selectedTournament, setSelectedTournament] = useState("");
  const [editingMatch, setEditingMatch] = useState(null);

  const { data: tournaments } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", selectedTournament],
    queryFn: async () =>
      (await api.get(`/api/tournaments/${selectedTournament}/matches`)).data,
    enabled: !!selectedTournament,
  });

  if (!selectedTournament && tournaments?.length > 0) {
    setSelectedTournament(tournaments[0]._id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          Quản lý Lịch thi đấu
        </h2>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="">Chọn giải đấu...</option>
          {tournaments?.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTournament ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-slate-200 uppercase">
              <tr>
                <th className="px-6 py-3">Vòng</th>
                <th className="px-6 py-3">Đội 1</th>
                <th className="px-6 py-3 text-center">Tỉ số</th>
                <th className="px-6 py-3">Đội 2</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matches?.map((m) => (
                <tr key={m._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4">Round {m.round}</td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {m.teamA?.name || "TBD"}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-100">
                    {m.scoreA} - {m.scoreB}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-100">
                    {m.teamB?.name || "TBD"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        m.state === "final"
                          ? "bg-green-500/10 text-green-500"
                          : m.state === "live"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {m.state}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingMatch(m)}
                        className="p-2 text-slate-400 hover:text-sky-400"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {matches?.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Chưa có trận đấu nào. Hãy tạo lịch thi đấu trong phần quản
                    lý giải đấu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
          Vui lòng chọn một giải đấu để xem lịch thi đấu
        </div>
      )}

      {editingMatch && (
        <MatchModal
          isOpen={!!editingMatch}
          onClose={() => setEditingMatch(null)}
          match={editingMatch}
        />
      )}
    </div>
  );
}

function MatchModal({ isOpen, onClose, match }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    scoreA: match?.scoreA || 0,
    scoreB: match?.scoreB || 0,
  });

  const updateMutation = useMutation({
    mutationFn: async (data) =>
      (await api.put(`/api/matches/${match._id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () =>
      (await api.patch(`/api/matches/${match._id}/confirm`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Cập nhật tỉ số
        </h3>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="mb-2 text-sm font-medium text-slate-300">
              {match.teamA?.name || "Team A"}
            </p>
            <input
              type="number"
              value={form.scoreA}
              onChange={(e) =>
                setForm({ ...form, scoreA: Number(e.target.value) })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-900 p-2 text-center text-xl font-bold text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <span className="text-slate-500">-</span>
          <div className="text-center">
            <p className="mb-2 text-sm font-medium text-slate-300">
              {match.teamB?.name || "Team B"}
            </p>
            <input
              type="number"
              value={form.scoreB}
              onChange={(e) =>
                setForm({ ...form, scoreB: Number(e.target.value) })
              }
              className="w-20 rounded-md border border-slate-800 bg-slate-900 p-2 text-center text-xl font-bold text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật tỉ số"}
          </button>

          {match.state !== "final" && (
            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 py-2 text-sm font-medium text-green-500 hover:bg-green-500/20"
            >
              <CheckCircle size={16} />
              Xác nhận kết quả (Kết thúc trận)
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-md border border-slate-800 py-2 text-sm font-medium text-slate-400 hover:bg-slate-900"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
