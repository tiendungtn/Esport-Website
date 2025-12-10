import React from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal.jsx";
import "../styles/pages/login.css";

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="login-container">
      <LoginModal open={true} onClose={() => navigate("/")} />
    </div>
  );
}
