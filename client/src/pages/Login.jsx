import React from "react";
import { useNavigate } from "react-router-dom";
import LoginModal from "./LoginModal.jsx";

export default function Login() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <LoginModal open={true} onClose={() => navigate("/")} />
    </div>
  );
}
