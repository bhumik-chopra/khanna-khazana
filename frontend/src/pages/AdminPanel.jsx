import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = "http://localhost:5000";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("North Indian");
  const [image, setImage] = useState(null);

  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });
  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  const submit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("admin_token");
    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      return;
    }
    if (!image) {
      showToast("error", "Image required", "Please upload an image.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append("price", price);
      fd.append("category", category);
      fd.append("image", image);

      const res = await fetch(`${API_BASE}/api/dishes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) {
        showToast("error", "Failed to add dish", data?.message || "Try again");
        return;
      }

      showToast("success", "Dish added", `${data.name} added successfully.`);

      setName("");
      setDescription("");
      setPrice("");
      setCategory("North Indian");
      setImage(null);
      // Note: file input can't be reset fully without a key; optional
    } catch (e2) {
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem" }}>
      {/* ✅ Top bar with button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: "0.5rem" }}>Admin Panel</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
            Add dishes to MongoDB. They will appear on the main website.
          </p>
        </div>

        {/* ✅ Delivery Portal button */}
        <button
          className="btn"
          onClick={() => navigate("/")}
          style={{
            background: "linear-gradient(90deg, #ff7a1a 0%, #008c4a 100%)",
            color: "white",
            border: "none",
            padding: "0.7rem 1rem",
            borderRadius: 14,
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          Delivery Portal
        </button>
      </div>

      <form onSubmit={submit} style={{ maxWidth: 560 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dish name"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          type="number"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (North Indian, South Indian...)"
          style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Save Dish
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