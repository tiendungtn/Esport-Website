import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Search, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminPlayers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    role: "player",
    password: "",
  });

  const { data: players, isLoading } = useQuery({
    queryKey: ["players", search],
    queryFn: async () => (await api.get(`/api/users?search=${search}`)).data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["players"]);
      closeModal();
    },
    onError: (err) =>
      alert(err.response?.data?.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/api/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["players"]);
      closeModal();
    },
    onError: (err) =>
      alert(err.response?.data?.message || "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["players"]);
      closeDeleteModal();
    },
    onError: (err) =>
      alert(err.response?.data?.message || "Failed to delete user"),
  });

  const openCreateModal = () => {
    setSelectedUser(null);
    setFormData({
      email: "",
      displayName: "",
      role: "player",
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      displayName: user.profile?.displayName || "",
      role: user.role,
      password: "", // Password empty on edit unless changing
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedUser) {
      // Update
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;
      updateMutation.mutate({ id: selectedUser._id, data: updateData });
    } else {
      // Create
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("ManagePlayers")}
        </h2>
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("SearchPlayerPlaceholder")}
              className="w-full rounded-md border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("AddPlayer") || "Thêm người chơi"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900 text-slate-200 uppercase">
            <tr>
              <th className="px-6 py-3">{t("DisplayName")}</th>
              <th className="px-6 py-3">{t("Email")}</th>
              <th className="px-6 py-3">{t("Role")}</th>
              <th className="px-6 py-3">{t("JoinDate")}</th>
              <th className="px-6 py-3 text-right">
                {t("Actions") || "Thao tác"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {players?.map((p) => (
              <tr key={p._id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                      {p.profile?.displayName?.[0] || "?"}
                    </div>
                    {p.profile?.displayName || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4">{p.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      p.role === "admin"
                        ? "bg-purple-500/10 text-purple-400"
                        : p.role === "organizer"
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {p.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(p)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {players?.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-slate-500"
                >
                  {t("NoPlayersFound") || "Không tìm thấy người chơi nào"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                {selectedUser
                  ? t("EditPlayer") || "Sửa người chơi"
                  : t("AddPlayer") || "Thêm người chơi"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t("DisplayName") || "Tên hiển thị"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t("Role") || "Vai trò"}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="player">Player</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {t("Password") || "Mật khẩu"}{" "}
                  {selectedUser && (
                    <span className="text-xs text-slate-500 font-normal">
                      ({t("Optional") || "Để trống nếu không đổi"})
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  required={!selectedUser}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white focus:border-sky-500 focus:outline-none"
                  placeholder={selectedUser ? "••••••••" : ""}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-700 bg-transparent py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  {t("Cancel") || "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : t("Save") || "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-center text-lg font-semibold text-white mb-2">
              {t("ConfirmDelete") || "Xác nhận xóa"}?
            </h3>
            <p className="text-center text-sm text-slate-400 mb-6">
              {t("DeleteUserWarning") ||
                "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 rounded-xl border border-slate-700 bg-transparent py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                {t("Cancel") || "Hủy"}
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedUser._id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending
                  ? "Deleting..."
                  : t("Delete") || "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
