import React from "react";
import { Link } from "react-router-dom";
import "../styles/pages/forgot-password.css";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fp-container">
      <div className="fp-card">
        <h1 className="fp-title">Forgot password</h1>
        <p className="fp-description">
          Demo: hệ thống chỉ giả lập gửi email đặt lại mật khẩu.
        </p>

        {submitted ? (
          <p className="fp-success">
            Nếu email tồn tại, một liên kết đặt lại mật khẩu đã được gửi.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="fp-form">
            <label className="fp-label">
              <span className="fp-label-text">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fp-input"
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" className="fp-submit-btn">
              Send reset link (demo)
            </button>
          </form>
        )}

        <div className="fp-back-container">
          <Link to="/login" className="fp-back-link">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
