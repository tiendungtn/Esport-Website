import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Admin() {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState({
    name: "",
    game: "",
    maxTeams: 16,
    description: "",
  });
  const [message, setMessage] = React.useState("");

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/tournaments", {
          name: form.name,
          game: form.game,
          maxTeams: Number(form.maxTeams) || 16,
          description: form.description,
          format: "SE",
        })
      ).data,
    onSuccess: () => {
      setMessage("Tạo giải đấu thành công!");
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
    },
    onError: (err) => {
      setMessage(err?.response?.data?.message || "Không tạo được giải đấu.");
    },
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    createMutation.mutate();
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold text-slate-50">
        Bảng điều khiển Organizer
      </h1>
      <p className="text-sm text-slate-400">
        Tạo giải đấu mới (Single Elimination, không thanh toán, không
        anti-cheat) đúng phạm vi đồ án.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
      >
        <Field
          label="Tên giải đấu"
          name="name"
          value={form.name}
          onChange={onChange}
          required
        />
        <Field
          label="Tựa game"
          name="game"
          value={form.game}
          onChange={onChange}
          placeholder="League of Legends, Valorant..."
          required
        />
        <Field
          label="Số đội tối đa"
          name="maxTeams"
          type="number"
          min={2}
          max={128}
          value={form.maxTeams}
          onChange={onChange}
        />
        <Field
          label="Mô tả"
          name="description"
          as="textarea"
          value={form.description}
          onChange={onChange}
        />

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex items-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          {createMutation.isPending ? "Đang tạo..." : "Tạo giải đấu"}
        </button>

        {message && <p className="text-sm text-slate-300">{message}</p>}
      </form>
    </div>
  );
}

function Field({ label, as = "input", ...rest }) {
  const InputTag = as;
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-200">{label}</span>
      <InputTag
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        {...rest}
      />
    </label>
  );
}
