import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import heroWordmark from "./image.png";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";

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

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Login failed", data?.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      showToast("success", "Logged in", "Welcome back to the control deck.");
      setTimeout(() => navigate("/panel"), 250);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg admin-login-bg-left" />
      <div className="admin-login-bg admin-login-bg-right" />

      <div className="container admin-login-layout">
        <section className="admin-login-copy">
          <div className="admin-badge">Khanna Khazana Control Deck</div>
          <img
            src={heroWordmark}
            alt="Khanna Khazana admin portal"
            className="admin-login-hero-image"
          />
          <p>
            A premium admin experience for managing dishes, categories, and storefront
            operations with a bold food-tech visual system.
          </p>

          <div className="admin-login-highlights">
            <div className="admin-highlight-card">
              <strong>Live menu editing</strong>
              <span>Add new dishes and refresh the storefront instantly.</span>
            </div>
            <div className="admin-highlight-card">
              <strong>Food-first visuals</strong>
              <span>Warm gradients, glass panels, and food-inspired backgrounds.</span>
            </div>
          </div>
        </section>

        <section className="admin-login-card">
          <div className="admin-card-kicker">Admin Login</div>
          <h2>Sign in to the panel</h2>
          <p>Use your admin credentials to manage the Khanna Khazana experience.</p>

          <form onSubmit={submit} className="admin-form">
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
              className="btn admin-secondary-button"
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
