import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function RegistrationModal({ tournamentId, onClose }) {
  const queryClient = useQueryClient();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [error, setError] = useState(null);

  const { data: myTeams, isLoading } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => (await api.get("/api/teams/mine")).data,
  });

  const registerMutation = useMutation({
    mutationFn: async (teamId) => {
      return (
        await api.post(`/api/tournaments/${tournamentId}/registrations`, {
          teamId,
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tournament", tournamentId]);
      onClose();
      alert("Đăng ký thành công!");
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    registerMutation.mutate(selectedTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-white">Đăng ký tham gia</h2>
        <p className="mt-1 text-sm text-slate-400">
          Chọn đội tuyển của bạn để tham gia giải đấu này.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Chọn đội tuyển
            </label>
            {isLoading ? (
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-800" />
            ) : myTeams?.length > 0 ? (
              <div className="space-y-2">
                {myTeams.map((team) => (
                  <label
                    key={team._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                      selectedTeam === team._id
                        ? "border-sky-500 bg-sky-500/10"
                        : "border-slate-800 bg-slate-800/50 hover:border-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="team"
                      value={team._id}
                      checked={selectedTeam === team._id}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="hidden"
                    />
                    <div className="h-8 w-8 rounded-lg bg-slate-700 overflow-hidden">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-bold">
                          {team.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{team.name}</div>
                      <div className="text-xs text-slate-400">
                        {team.members?.length || 1} thành viên
                      </div>
                    </div>
                    {selectedTeam === team._id && (
                      <div className="text-sky-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
                Bạn chưa có đội tuyển nào.{" "}
                <a
                  href="/teams/create"
                  className="text-sky-400 hover:underline"
                >
                  Tạo đội ngay
                </a>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-transparent py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!selectedTeam || registerMutation.isPending}
              className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? "Đang xử lý..." : "Đăng ký ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
