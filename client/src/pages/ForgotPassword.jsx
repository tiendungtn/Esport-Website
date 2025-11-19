import React from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-xl font-semibold text-slate-50">Forgot password</h1>
        <p className="mb-4 mt-1 text-sm text-slate-400">
          Demo: hệ thống chỉ giả lập gửi email đặt lại mật khẩu.
        </p>

        {submitted ? (
          <p className="text-sm text-emerald-400">
            Nếu email tồn tại, một liên kết đặt lại mật khẩu đã được gửi.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-200">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
            >
              Send reset link (demo)
            </button>
          </form>
        )}

        <div className="mt-4 text-xs text-slate-400">
          <Link
            to="/login"
            className="text-sky-400 underline hover:text-sky-300"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
