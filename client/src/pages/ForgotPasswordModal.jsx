import React from "react";
import Modal from "../components/Model";
import { X } from "lucide-react";

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ForgotPasswordModal({ open, onClose }) {
  const [email, setEmail] = React.useState("");
  const valid = isEmail(email);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white">
        {/* Header */}
        <div className="relative bg-white px-6 pt-6 pb-3 border-b">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-500 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            Reset Your Password
          </h1>
          <p className="text-slate-600 mt-1">
            We’ll send you an email with instructions to reset your password
          </p>
        </div>

        {/* Body */}
        <form
          className="p-6 bg-slate-50"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            // TODO: call API, show toast…
            onClose?.();
          }}
        >
          <label className="block bg-white border rounded-lg p-4">
            <div className="text-[13px] font-medium text-slate-900">
              Email<span className="text-rose-600">*</span>
            </div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!valid}
              className={`mt-4 w-full rounded-md py-2.5 font-semibold shadow
                ${
                  valid
                    ? "bg-[#3b6fe8] hover:bg-[#2f62e0] text-white"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
            >
              Send Instructions
            </button>
          </label>
        </form>
      </div>
    </Modal>
  );
}
