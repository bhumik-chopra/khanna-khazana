import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("admin_token"), []);

  const [activeTab, setActiveTab] = useState("add");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [rating, setRating] = useState("4.5");
  const [prepTime, setPrepTime] = useState("25-35 min");
  const [tags, setTags] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryMode, setCategoryMode] = useState("existing");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [dishes, setDishes] = useState([]);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const finalCategory =
    categoryMode === "new" ? newCategory.trim() : (selectedCategory || "").trim();

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes/categories`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data || []);
        if (!selectedCategory && data?.length) setSelectedCategory(data[0]);
      }
    } catch {
      // ignore
    }
  };

  const loadDishes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes`);
      const data = await res.json();
      if (res.ok) setDishes(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCategories();
    loadDishes();
    // The panel bootstraps both lists once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAdd = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/login");
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

      if (categoryMode === "new" && newCategory.trim()) {
        const c = newCategory.trim();
        setCategories((prev) => (prev.includes(c) ? prev : [c, ...prev]));
        setSelectedCategory(c);
        setCategoryMode("existing");
        setNewCategory("");
      }

      loadDishes();
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

  const deleteDish = async (dishId) => {
    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/login");
      return;
    }

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
      setDeleteTarget(null);
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
    <div className="admin-panel-page">
      <div className="container admin-panel-shell">
        <header className="admin-panel-header">
          <div>
            <div className="admin-badge">Khanna Khazana Admin Panel</div>
            <h1>Food operations control deck</h1>
            <p>Add dishes and manage them</p>
            
          </div>

          <div className="admin-panel-actions">
            <button
              className="btn btn-primary"
              onClick={() =>
                window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")
              }
            >
              Delivery portal
            </button>
            <button className="btn admin-secondary-button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="admin-panel-body">
          <aside className="admin-side-panel">
            <button
              type="button"
              className={`admin-tab-button ${activeTab === "add" ? "is-active" : ""}`}
              onClick={() => setActiveTab("add")}
            >
              Add Dish
            </button>
            <button
              type="button"
              className={`admin-tab-button ${activeTab === "remove" ? "is-active" : ""}`}
              onClick={() => setActiveTab("remove")}
            >
              Remove Dish
            </button>
          </aside>

          <div className="admin-content-panel">
            {activeTab === "add" && (
              <form onSubmit={submitAdd} className="admin-form admin-grid-form">
                <div className="admin-form-header">
                  <h2>Add a new dish</h2>
                  <p>Launch a new food card into the storefront with premium visual metadata.</p>
                </div>

                <label className="admin-field admin-field-full">
                  <span>Dish name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dish name" />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description"
                    rows={4}
                  />
                </label>

                <label className="admin-field">
                  <span>Price</span>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" />
                </label>

                <label className="admin-field">
                  <span>Category mode</span>
                  <select value={categoryMode} onChange={(e) => setCategoryMode(e.target.value)}>
                    <option value="existing">Use existing category</option>
                    <option value="new">Create new category</option>
                  </select>
                </label>

                {categoryMode === "existing" ? (
                  <label className="admin-field">
                    <span>Category</span>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
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
                  </label>
                ) : (
                  <label className="admin-field">
                    <span>New category</span>
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category"
                    />
                  </label>
                )}

                <label className="admin-field">
                  <span>Rating</span>
                  <input value={rating} onChange={(e) => setRating(e.target.value)} type="number" step="0.1" />
                </label>

                <label className="admin-field">
                  <span>Prep time</span>
                  <input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="25-35 min" />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Tags</span>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Creamy, Spicy, Street Food"
                  />
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={isBestseller}
                    onChange={(e) => setIsBestseller(e.target.checked)}
                  />
                  <span>Highlight as bestseller</span>
                </label>

                <label className="admin-field admin-field-full">
                  <span>Dish image</span>
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                </label>

                <button className="btn btn-primary admin-button-full">Save dish</button>
              </form>
            )}

            {activeTab === "remove" && (
              <div className="admin-remove-shell">
                <div className="admin-form-header">
                  <h2>Remove dishes</h2>
                  <p>Search through live menu inventory and remove dishes cleanly.</p>
                </div>

                <div className="admin-search-row">
                  <input
                    className="admin-search-input"
                    placeholder="Search by name or category"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <button className="btn admin-secondary-button" onClick={loadDishes} disabled={removeLoading}>
                    Refresh
                  </button>
                </div>

                <div className="admin-dish-list">
                  {filteredRemoveList.length === 0 ? (
                    <div className="admin-empty-state">No dishes found.</div>
                  ) : (
                    filteredRemoveList.map((d) => {
                      const dishId = d._id || d.id;
                      return (
                        <div key={dishId} className="admin-dish-row">
                          <div>
                            <div className="admin-dish-name">{d.name}</div>
                            <div className="admin-dish-meta">
                              {d.category} / Rs {d.price}
                            </div>
                          </div>

                          <button
                            className="btn admin-danger-button"
                            onClick={() => setDeleteTarget(d)}
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
          </div>
        </section>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {deleteTarget && (
        <div className="confirm-dialog-backdrop" role="presentation">
          <div
            className="confirm-dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="confirm-dialog-badge">Delete dish</div>
            <h3 id="delete-dialog-title" className="confirm-dialog-title">
              Confirm deletion
            </h3>
            <p className="confirm-dialog-text">
              Are you sure you want to delete <strong>{deleteTarget.name || "this dish"}</strong>?
            </p>
            <p className="confirm-dialog-subtext">
              This action removes it from the menu and cannot be undone from this panel.
            </p>

            <div className="confirm-dialog-actions">
              <button type="button" className="btn admin-secondary-button" onClick={() => setDeleteTarget(null)} disabled={removeLoading}>
                No
              </button>
              <button
                type="button"
                className="btn admin-danger-button"
                onClick={() => deleteDish(deleteTarget._id || deleteTarget.id)}
                disabled={removeLoading}
              >
                {removeLoading ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
