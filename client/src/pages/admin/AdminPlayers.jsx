import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Search, Plus, Pencil, Trash2, X, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../styles/pages/admin-players.css";

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
    <div className="ap-container">
      <div className="ap-header">
        <h2 className="ap-title">{t("ManagePlayers")}</h2>
        <div className="ap-controls">
          <div className="ap-search-wrapper">
            <Search className="ap-search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("SearchPlayerPlaceholder")}
              className="ap-search-input"
            />
          </div>
          <button onClick={openCreateModal} className="ap-create-btn">
            <Plus className="h-4 w-4" />
            {t("AddPlayer") || "Thêm người chơi"}
          </button>
        </div>
      </div>

      <div className="ap-table-container">
        <table className="ap-table">
          <thead className="ap-thead">
            <tr>
              <th className="ap-th">{t("DisplayName")}</th>
              <th className="ap-th">{t("Email")}</th>
              <th className="ap-th">{t("Role")}</th>
              <th className="ap-th">{t("JoinDate")}</th>
              <th className="ap-th-right">{t("Actions") || "Thao tác"}</th>
            </tr>
          </thead>
          <tbody className="ap-tbody">
            {players?.map((p) => (
              <tr key={p._id} className="ap-tr">
                <td className="ap-td-user">
                  <div className="ap-user-info">
                    <div className="ap-user-avatar">
                      {p.profile?.displayName?.[0] || "?"}
                    </div>
                    {p.profile?.displayName || "N/A"}
                  </div>
                </td>
                <td className="ap-td">{p.email}</td>
                <td className="ap-td">
                  <span
                    className={`ap-role-badge ${
                      p.role === "admin"
                        ? "ap-role-admin"
                        : p.role === "organizer"
                        ? "ap-role-organizer"
                        : "ap-role-player"
                    }`}
                  >
                    {p.role}
                  </span>
                </td>
                <td className="ap-td">
                  {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="ap-td-right">
                  <div className="ap-actions">
                    <button
                      onClick={() => openEditModal(p)}
                      className="ap-action-btn"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(p)}
                      className="ap-action-btn-danger"
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
                <td colSpan="5" className="ap-no-data">
                  {t("NoPlayersFound") || "Không tìm thấy người chơi nào"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="apm-overlay">
          <div className="apm-content">
            <div className="apm-header">
              <h2 className="apm-title">
                {selectedUser
                  ? t("EditPlayer") || "Sửa người chơi"
                  : t("AddPlayer") || "Thêm người chơi"}
              </h2>
              <button onClick={closeModal} className="apm-close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="apm-form">
              <div>
                <label className="apm-label">
                  {t("DisplayName") || "Tên hiển thị"}
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="apm-input"
                />
              </div>
              <div>
                <label className="apm-label">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="apm-input"
                />
              </div>
              <div>
                <label className="apm-label">{t("Role") || "Vai trò"}</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="apm-select"
                >
                  <option value="player">Player</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="apm-label">
                  {t("Password") || "Mật khẩu"}{" "}
                  {selectedUser && (
                    <span className="apm-hint">
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
                  className="apm-input"
                  placeholder={selectedUser ? "••••••••" : ""}
                />
              </div>

              <div className="apm-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="apm-btn-cancel"
                >
                  {t("Cancel") || "Hủy"}
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="apm-btn-save"
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
        <div className="apm-overlay">
          <div className="apm-delete-content">
            <div className="apm-delete-icon-wrapper">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="apm-delete-title">
              {t("ConfirmDelete") || "Xác nhận xóa"}?
            </h3>
            <p className="apm-delete-desc">
              {t("DeleteUserWarning") ||
                "Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."}
            </p>
            <div className="flex gap-3">
              <button onClick={closeDeleteModal} className="apm-btn-cancel">
                {t("Cancel") || "Hủy"}
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedUser._id)}
                disabled={deleteMutation.isPending}
                className="apm-btn-delete"
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
