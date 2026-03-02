import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = "http://localhost:5000";

export default function AdminPanel() {
  const navigate = useNavigate();

  // card fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  const [rating, setRating] = useState("4.5");
  const [prepTime, setPrepTime] = useState("25-35 min");
  const [tags, setTags] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);

  // categories
  const [categories, setCategories] = useState(["All"]);
  const [categoryMode, setCategoryMode] = useState("existing"); // existing | new
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });

  const showToast = (type, title, message) =>
    setToast({ open: true, type, title, message });

  // ✅ fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes/categories`);
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setCategories(data);
        // pick first non-All if available
        const first = data.find((c) => c && c !== "All") || "All";
        setSelectedCategory((prev) => prev || first);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const finalCategory =
    categoryMode === "new" ? newCategory.trim() : (selectedCategory || "").trim();

  const submit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("admin_token");
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
      fd.append("name", name.trim());
      fd.append("description", (description || "").trim());
      fd.append("price", String(price));
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

      // ✅ if new category created, refresh list
      if (categoryMode === "new" && newCategory.trim()) {
        await fetchCategories();
        setCategoryMode("existing");
        setSelectedCategory(newCategory.trim());
        setNewCategory("");
      }

      // reset form
      setName("");
      setDescription("");
      setPrice("");
      setImage(null);
      setRating("4.5");
      setPrepTime("25-35 min");
      setTags("");
      setIsBestseller(false);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem" }}>
      {/* top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14
        }}
      >
        <div>
          <h2 style={{ marginBottom: "0.5rem" }}>Admin Panel</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
            Add dishes to MongoDB. They will appear on the main website.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn"
            onClick={() =>
              window.open("http://localhost:3000", "_blank", "noopener,noreferrer")
            }
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

      <form onSubmit={submit} style={{ maxWidth: 560 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dish name *"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 10
          }}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 10
          }}
        />

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price *"
          type="number"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 10
          }}
        />

        {/* category selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <select
            value={categoryMode}
            onChange={(e) => setCategoryMode(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)"
            }}
          >
            <option value="existing">Choose existing category</option>
            <option value="new">Create new category</option>
          </select>

          {categoryMode === "existing" ? (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)"
              }}
            >
              {categories
                .filter((c) => c && c !== "All")
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          ) : (
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name *"
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)"
              }}
            />
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="Rating (e.g. 4.5)"
            type="number"
            step="0.1"
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)"
            }}
          />
          <input
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder='Prep time (e.g. "25-35 min")'
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)"
            }}
          />
        </div>

        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma separated) e.g. Creamy, Rich"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            marginBottom: 10
          }}
        />

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10
          }}
        >
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

        <button
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
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