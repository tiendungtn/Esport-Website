import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Search } from "lucide-react";

export default function AdminPlayers() {
  const [search, setSearch] = useState("");

  const { data: players, isLoading } = useQuery({
    queryKey: ["players", search],
    queryFn: async () => (await api.get(`/api/users?search=${search}`)).data,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          Quản lý Tuyển thủ
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm tuyển thủ..."
            className="w-full rounded-md border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 uppercase">
            <tr>
              <th className="px-6 py-3">Tên hiển thị</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Vai trò</th>
              <th className="px-6 py-3">Ngày tham gia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {players?.map((p) => (
              <tr key={p._id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-700"></div>
                    {p.profile?.displayName || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">{p.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                    {p.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
