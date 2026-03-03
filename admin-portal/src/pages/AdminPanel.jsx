import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";

export default function AdminPanel() {
  const navigate = useNavigate();

  const token = useMemo(() => localStorage.getItem("admin_token"), []);

  // tab: add | remove
  const [activeTab, setActiveTab] = useState("add");

  // ---------- ADD DISH FORM ----------
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const [rating, setRating] = useState("4.5");
  const [prepTime, setPrepTime] = useState("25-35 min");
  const [tags, setTags] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);

  // categories
  const [categories, setCategories] = useState([]);
  const [categoryMode, setCategoryMode] = useState("existing");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // ---------- REMOVE DISH ----------
  const [dishes, setDishes] = useState([]);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [search, setSearch] = useState("");

  // toast
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });
  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const finalCategory =
    categoryMode === "new" ? newCategory.trim() : (selectedCategory || "").trim();

  // fetch categories
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes/categories`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data || []);
        if (!selectedCategory && data?.length) setSelectedCategory(data[0]);
      }
    } catch {}
  };

  // fetch dishes for remove tab
  const loadDishes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes`);
      const data = await res.json();
      if (res.ok) setDishes(data || []);
    } catch {}
  };

  useEffect(() => {
    loadCategories();
    loadDishes();
    // eslint-disable-next-line
  }, []);

  // ---------- ADD DISH SUBMIT ----------
  const submitAdd = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/admin/login");
      return;
    }

    if (!name.trim() || !price || !finalCategory) {
      showToast("error", "Missing fields", "Name, price and category are required.");
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
      fd.append("category", finalCategory);
      fd.append("rating", rating);
      fd.append("prepTime", prepTime);
      fd.append("tags", tags);
      fd.append("isBestseller", String(isBestseller));
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

      // refresh categories if new category
      if (categoryMode === "new" && newCategory.trim()) {
        const c = newCategory.trim();
        setCategories((prev) => (prev.includes(c) ? prev : [c, ...prev]));
        setSelectedCategory(c);
        setCategoryMode("existing");
        setNewCategory("");
      }

      // refresh dishes list (for remove tab)
      loadDishes();

      // reset form
      setName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setRating("4.5");
      setPrepTime("25-35 min");
      setTags("");
      setIsBestseller(false);
    } catch {
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  // ---------- DELETE DISH ----------
  const deleteDish = async (dishId) => {
    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/admin/login");
      return;
    }

    const ok = window.confirm("Are you sure you want to delete this dish?");
    if (!ok) return;

    try {
      setRemoveLoading(true);

      const res = await fetch(`${API_BASE}/api/dishes/${dishId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Delete failed", data?.message || "Try again");
        return;
      }

      showToast("success", "Deleted", "Dish removed successfully.");
      setDishes((prev) => prev.filter((d) => (d._id || d.id) !== dishId));
    } catch {
      showToast("error", "Network error", "Backend not reachable");
    } finally {
      setRemoveLoading(false);
    }
  };

  const filteredRemoveList = dishes.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: "2rem" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: "0.5rem" }}>Admin Panel</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
            Add / Remove dishes from MongoDB.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            onClick={() => window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")}
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

          <button
            className="btn"
            onClick={logout}
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "0.7rem 1rem",
              borderRadius: 14,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ✅ Two Bootstrap buttons (tabs) */}
      <div className="d-flex gap-2 mt-3 mb-4">
        <button
          type="button"
          className={`btn ${activeTab === "add" ? "btn-success" : "btn-outline-success"}`}
          onClick={() => setActiveTab("add")}
          style={{ borderRadius: 12, fontWeight: 800 }}
        >
          Add Dish
        </button>

        <button
          type="button"
          className={`btn ${activeTab === "remove" ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setActiveTab("remove")}
          style={{ borderRadius: 12, fontWeight: 800 }}
        >
          Remove Dish
        </button>
      </div>

      {/* ---------------- ADD TAB ---------------- */}
      {activeTab === "add" && (
        <form onSubmit={submitAdd} style={{ maxWidth: 560 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dish name *"
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
            placeholder="Price *"
            type="number"
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
          />

          {/* Category */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select
              value={categoryMode}
              onChange={(e) => setCategoryMode(e.target.value)}
              style={{ padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
            >
              <option value="existing">Choose existing category</option>
              <option value="new">Create new category</option>
            </select>

            {categoryMode === "existing" ? (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
              >
                {categories.length === 0 ? (
                  <option value="">No categories found</option>
                ) : (
                  categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name *"
                style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
              />
            )}
          </div>

          {/* rating + time */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="Rating (e.g. 4.5)"
              type="number"
              step="0.1"
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
            />
            <input
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder='Prep time (e.g. "25-35 min")'
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
            />
          </div>

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder='Tags (comma separated) e.g. Creamy, Rich'
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", marginBottom: 10 }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
            />
            Mark as Bestseller
          </label>

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
      )}

      {/* ---------------- REMOVE TAB ---------------- */}
      {activeTab === "remove" && (
        <div style={{ maxWidth: 720 }}>
          <div className="d-flex gap-2 align-items-center mb-3">
            <input
              className="form-control"
              placeholder="Search by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: 12 }}
            />

            <button
              className="btn btn-outline-secondary"
              onClick={loadDishes}
              style={{ borderRadius: 12, fontWeight: 800 }}
              disabled={removeLoading}
            >
              Refresh
            </button>
          </div>

          <div className="list-group">
            {filteredRemoveList.length === 0 ? (
              <div className="text-muted">No dishes found.</div>
            ) : (
              filteredRemoveList.map((d) => {
                const dishId = d._id || d.id;
                return (
                  <div
                    key={dishId}
                    className="list-group-item d-flex justify-content-between align-items-center"
                    style={{ borderRadius: 12, marginBottom: 10 }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                        {d.category} • ₹{d.price}
                      </div>
                    </div>

                    <button
                      className="btn btn-danger"
                      style={{ borderRadius: 12, fontWeight: 800 }}
                      onClick={() => deleteDish(dishId)}
                      disabled={removeLoading}
                    >
                      Delete
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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