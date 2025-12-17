import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Edit, Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { translateGameName } from "../../lib/gameTranslations";
import "../../styles/pages/admin-tournaments.css";
import AdminRegistrations from "./AdminRegistrations";

export default function AdminTournaments() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: async () => (await api.get("/api/tournaments")).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/api/tournaments/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      setDeleteSuccessMessage(t("TournamentDeletedSuccess"));
    },
  });

  const handleDelete = (tournament) => {
    setTournamentToDelete(tournament);
  };

  const handleEdit = (tournament) => {
    setEditingTournament(tournament);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingTournament(null);
    setIsModalOpen(true);
  };

  const handleViewRegistrations = (id) => {
    setSelectedTournamentId(id);
    setIsRegistrationsOpen(true);
  };

  if (isLoading) return <div>{t("Loading")}</div>;

  return (
    <div className="at-container">
      <div className="at-header">
        <h2 className="at-title">{t("ManageTournaments")}</h2>
        <button onClick={handleCreate} className="at-create-btn">
          <Plus size={16} />
          {t("CreateTournamentBtn")}
        </button>
      </div>

      <div className="at-table-container">
        <table className="at-table">
          <thead className="at-thead">
            <tr>
              <th className="at-th">{t("TableName")}</th>
              <th className="at-th">{t("TableGame")}</th>
              <th className="at-th">{t("TableTeams")}</th>
              <th className="at-th">{t("TableStatus")}</th>
              <th className="at-th-right">{t("TableActions")}</th>
            </tr>
          </thead>
          <tbody className="at-tbody">
            {tournaments?.map((tournament) => (
              <tr key={tournament._id} className="at-tr">
                <td className="at-td-name">{tournament.name}</td>
                <td className="at-td">{translateGameName(tournament.game)}</td>
                <td className="at-td">{tournament.maxTeams}</td>
                <td className="at-td">
                  <span
                    className={`at-status-badge ${
                      tournament.status === "open"
                        ? "at-status-open"
                        : tournament.status === "ongoing"
                        ? "at-status-ongoing"
                        : "at-status-finished"
                    }`}
                  >
                    {tournament.status === "open" && t("StatusOpen")}
                    {tournament.status === "ongoing" && t("StatusOngoing")}
                    {tournament.status === "finished" && t("StatusFinished")}
                    {tournament.status === "draft" && t("StatusDraft")}
                  </span>
                </td>
                <td className="at-td-right">
                  <div className="at-actions">
                    <button
                      onClick={() => handleViewRegistrations(tournament._id)}
                      className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                      title={t("ViewRegistrations")}
                    >
                      <ClipboardCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(tournament)}
                      className="at-action-btn-edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament)}
                      className="at-action-btn-delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <TournamentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tournament={editingTournament}
        />
      )}

      {isRegistrationsOpen && selectedTournamentId && (
        <AdminRegistrations
          tournamentId={selectedTournamentId}
          onClose={() => setIsRegistrationsOpen(false)}
        />
      )}

      {/* Modal xác nhận xóa */}
      {tournamentToDelete && (
        <div className="atm-overlay">
          <div className="atm-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atm-title text-xl text-red-500">
                {t("ConfirmDeleteTournament")}
              </h3>
              <button
                onClick={() => setTournamentToDelete(null)}
                className="text-slate-400 hover:text-white"
              >
                <Trash2 size={20} className="hidden" />{" "}
                {/* Icon ẩn, chỉ để nhất quán nếu cần, nhưng thường dùng X */}X
              </button>
            </div>
            <p className="text-slate-300 mb-6">
              {t("AreYouSureDeleteTournament", {
                name: tournamentToDelete.name,
              })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTournamentToDelete(null)}
                className="px-4 py-2 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
              >
                {t("Cancel")}
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(tournamentToDelete._id);
                  setTournamentToDelete(null);
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                {t("Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thành công */}
      {deleteSuccessMessage && (
        <div className="atm-overlay">
          <div className="atm-content">
            <div className="flex justify-between items-center mb-6">
              <h3 className="atm-title text-xl text-green-500">
                {t("RegistrationSuccessTitle")}
              </h3>
              <button
                onClick={() => setDeleteSuccessMessage("")}
                className="text-slate-400 hover:text-white"
              >
                X
              </button>
            </div>
            <p className="text-slate-300 mb-6">{deleteSuccessMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteSuccessMessage("")}
                className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentModal({ isOpen, onClose, tournament }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Hàm hỗ trợ: Định dạng ngày ISO thành yyyy-MM-ddThh:mm cho input
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return ""; // Ngày không hợp lệ
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [form, setForm] = useState({
    name: "",
    game: "",
    maxTeams: 16,
    description: "",
    schedule: {
      regOpen: "",
      regClose: "",
      startAt: "",
    },
  });

  // Cập nhật form khi giải đấu thay đổi (cho chế độ chỉnh sửa)
  React.useEffect(() => {
    if (tournament) {
      console.log("Đang tải giải đấu để chỉnh sửa:", tournament); // Log debug
      setForm({
        name: tournament.name || "",
        game: tournament.game || "",
        maxTeams: tournament.maxTeams || 16,
        description: tournament.description || "",
        schedule: {
          regOpen: formatDateForInput(tournament.schedule?.regOpen),
          regClose: formatDateForInput(tournament.schedule?.regClose),
          startAt: formatDateForInput(tournament.schedule?.startAt),
        },
      });
    } else {
      // Đặt lại form cho chế độ tạo mới
      setForm({
        name: "",
        game: "",
        maxTeams: 16,
        description: "",
        schedule: {
          regOpen: "",
          regClose: "",
          startAt: "",
        },
      });
    }
  }, [tournament]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      // Xây dựng đối tượng schedule đúng cách
      const payload = { ...data };

      // Xây dựng schedule chỉ với các giá trị không rỗng
      const schedule = {};
      if (data.schedule.regOpen) schedule.regOpen = data.schedule.regOpen;
      if (data.schedule.regClose) schedule.regClose = data.schedule.regClose;
      if (data.schedule.startAt) schedule.startAt = data.schedule.startAt;

      // Chỉ bao gồm schedule nếu có giá trị
      if (Object.keys(schedule).length > 0) {
        payload.schedule = schedule;
      } else {
        // Xóa hoàn toàn schedule nếu rỗng để tránh ghi đè bằng đối tượng rỗng
        delete payload.schedule;
      }

      console.log("Gửi payload:", payload); // Log debug

      if (tournament) {
        return (await api.put(`/api/tournaments/${tournament._id}`, payload))
          .data;
      } else {
        return (
          await api.post("/api/tournaments", { ...payload, format: "SE" })
        ).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (!isOpen) return null;

  return (
    <div className="atm-overlay">
      <div className="atm-content">
        <h3 className="atm-title">
          {tournament ? t("EditTournament") : t("CreateNewTournament")}
        </h3>
        <form onSubmit={handleSubmit} className="atm-form">
          <div>
            <label className="atm-label">{t("FormName")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="atm-input"
              required
            />
          </div>
          <div>
            <label className="atm-label">{t("FormGame")}</label>
            <input
              value={form.game}
              onChange={(e) => setForm({ ...form, game: e.target.value })}
              className="atm-input"
              required
            />
          </div>
          <div>
            <label className="atm-label">{t("FormMaxTeams")}</label>
            <input
              type="number"
              value={form.maxTeams}
              onChange={(e) =>
                setForm({ ...form, maxTeams: Number(e.target.value) })
              }
              className="atm-input"
            />
          </div>

          {/* Cài đặt thời gian đăng ký */}
          <fieldset
            style={{
              border: "1px solid rgb(51 65 85)",
              borderRadius: "0.5rem",
              padding: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <legend
              style={{
                color: "rgb(148 163 184)",
                padding: "0 0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              {t("RegistrationTimeSettings") || "Cài đặt thời gian đăng ký"}
            </legend>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label className="atm-label">{t("FormRegOpen")}</label>
                <input
                  type="datetime-local"
                  value={form.schedule.regOpen}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      schedule: { ...form.schedule, regOpen: e.target.value },
                    })
                  }
                  className="atm-input"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label className="atm-label">{t("FormRegClose")}</label>
                <input
                  type="datetime-local"
                  value={form.schedule.regClose}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      schedule: { ...form.schedule, regClose: e.target.value },
                    })
                  }
                  className="atm-input"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label className="atm-label">{t("FormStartAt")}</label>
                <input
                  type="datetime-local"
                  value={form.schedule.startAt}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      schedule: { ...form.schedule, startAt: e.target.value },
                    })
                  }
                  className="atm-input"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </fieldset>

          <div>
            <label className="atm-label">{t("FormDescription")}</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="atm-textarea"
              rows={3}
            />
          </div>
          <div className="atm-footer">
            <button type="button" onClick={onClose} className="atm-btn-cancel">
              {t("Cancel")}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="atm-btn-save"
            >
              {mutation.isPending ? t("Saving") : t("Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
