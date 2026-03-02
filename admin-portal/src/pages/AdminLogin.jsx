import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = "http://localhost:5000";

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

  const showToast = (type, title, message) =>
    setToast({ open: true, type, title, message });

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
      showToast("success", "Logged in", "Welcome admin!");

      // ✅ go to panel
      setTimeout(() => navigate("/panel"), 250);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <h2 style={{ marginBottom: "0.5rem" }}>Admin Login</h2>
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Use your admin credentials.
      </p>

      <form onSubmit={submit} style={{ maxWidth: 420 }}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 10
          }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 12
          }}
        />

        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          Login
        </button>

        {/* ✅ Delivery Portal button */}
        <button
          type="button"
          className="btn"
          onClick={() =>
            window.open("http://localhost:3000", "_blank", "noopener,noreferrer")
          }
          style={{
            width: "100%",
            justifyContent: "center",
            marginTop: 10,
            background: "white",
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
            padding: "0.7rem 1rem",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Go to Delivery Portal
        </button>
      </form>

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