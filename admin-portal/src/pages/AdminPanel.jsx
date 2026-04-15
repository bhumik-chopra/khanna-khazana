import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";

const createEmptyDishForm = () => ({
  name: "",
  description: "",
  price: "",
  image: null,
  prepTime: "25-35 min",
  tags: "",
  isBestseller: false,
  categoryMode: "existing",
  selectedCategory: "",
  newCategory: ""
});

const tagsToInput = (tags) =>
  Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : "";

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("admin_token"), []);

  const [activeTab, setActiveTab] = useState("add");
  const [addForm, setAddForm] = useState(createEmptyDishForm);
  const [updateForm, setUpdateForm] = useState(createEmptyDishForm);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [removeSearch, setRemoveSearch] = useState("");
  const [updateSearch, setUpdateSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingDishId, setEditingDishId] = useState("");
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

  const finalAddCategory =
    addForm.categoryMode === "new" ? addForm.newCategory.trim() : addForm.selectedCategory.trim();
  const finalUpdateCategory =
    updateForm.categoryMode === "new"
      ? updateForm.newCategory.trim()
      : updateForm.selectedCategory.trim();

  const setAddField = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const setUpdateField = (field, value) => {
    setUpdateForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAddForm = () => {
    setAddForm((prev) => ({
      ...createEmptyDishForm(),
      selectedCategory: categories[0] || prev.selectedCategory || ""
    }));
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes/categories`);
      const data = await res.json();

      if (res.ok) {
        const cleanedCategories = (data || []).filter((category) => category && category !== "All");
        setCategories(cleanedCategories);
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

  const buildDishFormData = (form, category) => {
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("category", category);
    fd.append("prepTime", form.prepTime);
    fd.append("tags", form.tags);
    fd.append("isBestseller", String(form.isBestseller));

    if (form.image) {
      fd.append("image", form.image);
    }

    return fd;
  };

  const selectDishForUpdate = (dish) => {
    const dishId = dish._id || dish.id;
    const dishCategory = (dish.category || "").trim();
    const usesExistingCategory = categories.includes(dishCategory);

    setEditingDishId(dishId);
    setUpdateForm({
      name: dish.name || "",
      description: dish.description || "",
      price: dish.price ?? "",
      image: null,
      prepTime: dish.prepTime || "25-35 min",
      tags: tagsToInput(dish.tags),
      isBestseller: Boolean(dish.isBestseller),
      categoryMode: usesExistingCategory ? "existing" : "new",
      selectedCategory: usesExistingCategory ? dishCategory : categories[0] || "",
      newCategory: usesExistingCategory ? "" : dishCategory
    });
    setActiveTab("update");
  };

  useEffect(() => {
    loadCategories();
    loadDishes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categories.length) return;

    setAddForm((prev) =>
      prev.selectedCategory ? prev : { ...prev, selectedCategory: categories[0] }
    );

    setUpdateForm((prev) => {
      if (prev.categoryMode !== "existing" || prev.selectedCategory || !editingDishId) {
        return prev;
      }

      return { ...prev, selectedCategory: categories[0] };
    });
  }, [categories, editingDishId]);

  const submitAdd = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/login");
      return;
    }

    if (!addForm.name.trim() || !addForm.price || !finalAddCategory) {
      showToast("error", "Missing fields", "Name, price and category are required.");
      return;
    }

    if (!addForm.image) {
      showToast("error", "Image required", "Please upload an image.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/dishes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildDishFormData(addForm, finalAddCategory)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Failed to add dish", data?.message || "Try again");
        return;
      }

      showToast("success", "Dish added", `${data.name} added successfully.`);

      if (addForm.categoryMode === "new" && finalAddCategory) {
        setCategories((prev) => (prev.includes(finalAddCategory) ? prev : [finalAddCategory, ...prev]));
      }

      resetAddForm();
      loadDishes();
      loadCategories();
    } catch {
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  const submitUpdate = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast("error", "Not logged in", "Please login first.");
      navigate("/login");
      return;
    }

    if (!editingDishId) {
      showToast("error", "Choose a dish", "Select a dish to update first.");
      return;
    }

    if (!updateForm.name.trim() || !updateForm.price || !finalUpdateCategory) {
      showToast("error", "Missing fields", "Name, price and category are required.");
      return;
    }

    try {
      setUpdateLoading(true);

      const res = await fetch(`${API_BASE}/api/dishes/${editingDishId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildDishFormData(updateForm, finalUpdateCategory)
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Update failed", data?.message || "Try again");
        return;
      }

      showToast("success", "Dish updated", `${data.name} updated successfully.`);
      setDishes((prev) => prev.map((dish) => ((dish._id || dish.id) === editingDishId ? data : dish)));

      if (!categories.includes(finalUpdateCategory)) {
        setCategories((prev) => [finalUpdateCategory, ...prev]);
      }

      selectDishForUpdate(data);
      loadCategories();
    } catch {
      showToast("error", "Network error", "Backend not reachable");
    } finally {
      setUpdateLoading(false);
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
      setDishes((prev) => prev.filter((dish) => (dish._id || dish.id) !== dishId));

      if (editingDishId === dishId) {
        setEditingDishId("");
        setUpdateForm((prev) => ({
          ...createEmptyDishForm(),
          selectedCategory: categories[0] || prev.selectedCategory || ""
        }));
      }
    } catch {
      showToast("error", "Network error", "Backend not reachable");
    } finally {
      setRemoveLoading(false);
      setDeleteTarget(null);
    }
  };

  const filteredRemoveList = dishes.filter((dish) => {
    const query = removeSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      (dish.name || "").toLowerCase().includes(query) ||
      (dish.category || "").toLowerCase().includes(query)
    );
  });

  const filteredUpdateList = dishes.filter((dish) => {
    const query = updateSearch.trim().toLowerCase();
    if (!query) return true;

    return (
      (dish.name || "").toLowerCase().includes(query) ||
      (dish.category || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="admin-panel-page">
      <div className="container admin-panel-shell">
        <header className="admin-panel-header">
          <div>
            <div className="admin-badge">Khanna Khazana Admin Panel</div>
            <h1>Food operations control deck</h1>
            <p>Add dishes, update every live detail, and manage removals in one place.</p>
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
              className={`admin-tab-button ${activeTab === "update" ? "is-active" : ""}`}
              onClick={() => setActiveTab("update")}
            >
              Update Dish
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
                  <p>Launch a new food card into the storefront with the core menu details.</p>
                </div>

                <label className="admin-field admin-field-full">
                  <span>Dish name</span>
                  <input
                    value={addForm.name}
                    onChange={(e) => setAddField("name", e.target.value)}
                    placeholder="Dish name"
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Description</span>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddField("description", e.target.value)}
                    placeholder="Short description"
                    rows={4}
                  />
                </label>

                <label className="admin-field">
                  <span>Price</span>
                  <input
                    value={addForm.price}
                    onChange={(e) => setAddField("price", e.target.value)}
                    placeholder="Price"
                    type="number"
                  />
                </label>

                <label className="admin-field">
                  <span>Category mode</span>
                  <select
                    value={addForm.categoryMode}
                    onChange={(e) => setAddField("categoryMode", e.target.value)}
                  >
                    <option value="existing">Use existing category</option>
                    <option value="new">Create new category</option>
                  </select>
                </label>

                {addForm.categoryMode === "existing" ? (
                  <label className="admin-field">
                    <span>Category</span>
                    <select
                      value={addForm.selectedCategory}
                      onChange={(e) => setAddField("selectedCategory", e.target.value)}
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories found</option>
                      ) : (
                        categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                ) : (
                  <label className="admin-field">
                    <span>New category</span>
                    <input
                      value={addForm.newCategory}
                      onChange={(e) => setAddField("newCategory", e.target.value)}
                      placeholder="New category"
                    />
                  </label>
                )}

                <label className="admin-field">
                  <span>Prep time</span>
                  <input
                    value={addForm.prepTime}
                    onChange={(e) => setAddField("prepTime", e.target.value)}
                    placeholder="25-35 min"
                  />
                </label>

                <label className="admin-field admin-field-full">
                  <span>Tags</span>
                  <input
                    value={addForm.tags}
                    onChange={(e) => setAddField("tags", e.target.value)}
                    placeholder="Creamy, Spicy, Street Food"
                  />
                </label>

                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={addForm.isBestseller}
                    onChange={(e) => setAddField("isBestseller", e.target.checked)}
                  />
                  <span>Highlight as bestseller</span>
                </label>

                <label className="admin-field admin-field-full">
                  <span>Dish image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAddField("image", e.target.files?.[0] || null)}
                  />
                </label>

                <button className="btn btn-primary admin-button-full">Save dish</button>
              </form>
            )}

            {activeTab === "update" && (
              <div className="admin-remove-shell">
                <div className="admin-form-header">
                  <h2>Update dishes</h2>
                  <p>Pick any live dish, change every core field, and optionally replace its image.</p>
                </div>

                <div className="admin-search-row">
                  <input
                    className="admin-search-input"
                    placeholder="Search by name or category"
                    value={updateSearch}
                    onChange={(e) => setUpdateSearch(e.target.value)}
                  />

                  <button className="btn admin-secondary-button" onClick={loadDishes} disabled={updateLoading}>
                    Refresh
                  </button>
                </div>

                <div className="admin-dish-list">
                  {filteredUpdateList.length === 0 ? (
                    <div className="admin-empty-state">No dishes found.</div>
                  ) : (
                    filteredUpdateList.map((dish) => {
                      const dishId = dish._id || dish.id;
                      return (
                        <div
                          key={dishId}
                          className={`admin-dish-row ${editingDishId === dishId ? "is-selected" : ""}`}
                        >
                          <div>
                            <div className="admin-dish-name">{dish.name}</div>
                            <div className="admin-dish-meta">
                              {dish.category} / Rs {dish.price}
                            </div>
                          </div>

                          <button
                            className="btn admin-secondary-button"
                            onClick={() => selectDishForUpdate(dish)}
                            type="button"
                          >
                            {editingDishId === dishId ? "Editing" : "Edit"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {editingDishId ? (
                  <form onSubmit={submitUpdate} className="admin-form admin-grid-form">
                    <div className="admin-form-header">
                      <h2>Update selected dish</h2>
                      <p>Save changes to the live storefront listing whenever you are ready.</p>
                    </div>

                    <label className="admin-field admin-field-full">
                      <span>Dish name</span>
                      <input
                        value={updateForm.name}
                        onChange={(e) => setUpdateField("name", e.target.value)}
                        placeholder="Dish name"
                      />
                    </label>

                    <label className="admin-field admin-field-full">
                      <span>Description</span>
                      <textarea
                        value={updateForm.description}
                        onChange={(e) => setUpdateField("description", e.target.value)}
                        placeholder="Short description"
                        rows={4}
                      />
                    </label>

                    <label className="admin-field">
                      <span>Price</span>
                      <input
                        value={updateForm.price}
                        onChange={(e) => setUpdateField("price", e.target.value)}
                        placeholder="Price"
                        type="number"
                      />
                    </label>

                    <label className="admin-field">
                      <span>Category mode</span>
                      <select
                        value={updateForm.categoryMode}
                        onChange={(e) => setUpdateField("categoryMode", e.target.value)}
                      >
                        <option value="existing">Use existing category</option>
                        <option value="new">Create new category</option>
                      </select>
                    </label>

                    {updateForm.categoryMode === "existing" ? (
                      <label className="admin-field">
                        <span>Category</span>
                        <select
                          value={updateForm.selectedCategory}
                          onChange={(e) => setUpdateField("selectedCategory", e.target.value)}
                        >
                          {categories.length === 0 ? (
                            <option value="">No categories found</option>
                          ) : (
                            categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    ) : (
                      <label className="admin-field">
                        <span>New category</span>
                        <input
                          value={updateForm.newCategory}
                          onChange={(e) => setUpdateField("newCategory", e.target.value)}
                          placeholder="New category"
                        />
                      </label>
                    )}

                    <label className="admin-field">
                      <span>Prep time</span>
                      <input
                        value={updateForm.prepTime}
                        onChange={(e) => setUpdateField("prepTime", e.target.value)}
                        placeholder="25-35 min"
                      />
                    </label>

                    <label className="admin-field admin-field-full">
                      <span>Tags</span>
                      <input
                        value={updateForm.tags}
                        onChange={(e) => setUpdateField("tags", e.target.value)}
                        placeholder="Creamy, Spicy, Street Food"
                      />
                    </label>

                    <label className="admin-checkbox">
                      <input
                        type="checkbox"
                        checked={updateForm.isBestseller}
                        onChange={(e) => setUpdateField("isBestseller", e.target.checked)}
                      />
                      <span>Highlight as bestseller</span>
                    </label>

                    <label className="admin-field admin-field-full">
                      <span>Replace dish image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setUpdateField("image", e.target.files?.[0] || null)}
                      />
                    </label>

                    <div className="admin-dish-meta admin-field-full">
                      {updateForm.image
                        ? `New image selected: ${updateForm.image.name}`
                        : "Leave the image empty if you want to keep the current one."}
                    </div>

                    <button className="btn btn-primary admin-button-full" disabled={updateLoading}>
                      {updateLoading ? "Updating..." : "Update dish"}
                    </button>
                  </form>
                ) : (
                  <div className="admin-empty-state">Choose a dish above to open the update form.</div>
                )}
              </div>
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
                    value={removeSearch}
                    onChange={(e) => setRemoveSearch(e.target.value)}
                  />

                  <button className="btn admin-secondary-button" onClick={loadDishes} disabled={removeLoading}>
                    Refresh
                  </button>
                </div>

                <div className="admin-dish-list">
                  {filteredRemoveList.length === 0 ? (
                    <div className="admin-empty-state">No dishes found.</div>
                  ) : (
                    filteredRemoveList.map((dish) => {
                      const dishId = dish._id || dish.id;
                      return (
                        <div key={dishId} className="admin-dish-row">
                          <div>
                            <div className="admin-dish-name">{dish.name}</div>
                            <div className="admin-dish-meta">
                              {dish.category} / Rs {dish.price}
                            </div>
                          </div>

                          <button
                            className="btn admin-danger-button"
                            onClick={() => setDeleteTarget(dish)}
                            disabled={removeLoading}
                            type="button"
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
        onClose={() => setToast((currentToast) => ({ ...currentToast, open: false }))}
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
              <button
                type="button"
                className="btn admin-secondary-button"
                onClick={() => setDeleteTarget(null)}
                disabled={removeLoading}
              >
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
