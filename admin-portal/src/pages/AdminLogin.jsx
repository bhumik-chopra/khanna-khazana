import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const ADMIN_USERNAME = "bhumik";
const ADMIN_PASSWORD = "8178307875";
const ADMIN_TOKEN = "khanna-khazana-platform-admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  useEffect(() => {
    if (localStorage.getItem("admin_token")) {
      navigate("/panel", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      showToast("error", "Login failed", "Invalid platform admin credentials.");
      return;
    }

    localStorage.setItem("admin_token", ADMIN_TOKEN);
    showToast("success", "Logged in", "Welcome to the control deck.");
    setTimeout(() => navigate("/panel"), 200);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg admin-login-bg-left" />
      <div className="admin-login-bg admin-login-bg-right" />

      <div className="container admin-login-shell">
        <section className="admin-login-card admin-login-card-platform">
          <Link to="/" className="admin-entry-back">
            Back to entry
          </Link>

          <div className="admin-card-kicker">Platform admin login</div>
          <h2>Platform admin login</h2>

          <form onSubmit={handleSubmit} className="admin-form admin-form-platform">
            <label className="admin-field">
              <span>Username</span>
              <input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Password</span>
              <input
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button className="btn btn-primary admin-button-full">Enter control deck</button>

            <button
              type="button"
              className="btn admin-secondary-button admin-button-full"
              onClick={() =>
                window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")
              }
            >
              Open delivery portal
            </button>
          </form>
        </section>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
