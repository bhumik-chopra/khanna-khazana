/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";
const STATUS_OPTIONS = ["verified", "pending", "rejected", "expired", "needs_reinspection"];
const QUALITY_OPTIONS = ["good", "average", "poor", "unchecked"];
const DOC_TYPES = ["fssai_certificate", "kitchen_photo", "inspection_report", "pest_control_proof", "staff_hygiene_proof", "compliance_document"];
const CHECKS = [
  ["kitchenClean", "Kitchen clean"],
  ["cookingAreaClean", "Cooking area clean"],
  ["storageProper", "Storage proper"],
  ["staffWearingGlovesCaps", "Staff gloves/caps"],
  ["wasteDisposalProper", "Waste disposal proper"],
  ["packagingAreaHygienic", "Packaging area hygienic"],
  ["refrigerationProper", "Refrigeration proper"]
];

const emptyRestaurant = { id: "", name: "", description: "", location: "", gstnNumber: "", fssaiLicenseNumber: "", fssaiExpiryDate: "", kitchenVerificationStatus: "pending", lastInspectionDate: "", nextInspectionDate: "", packagingStatus: "unchecked", staffHygieneStatus: "unchecked", foodHandlingStatus: "unchecked", remarksByAdmin: "", verifiedBy: "admin" };
const emptyDish = { name: "", description: "", price: "", image: null, prepTime: "25-35 min", tags: "", isBestseller: false, categoryMode: "existing", selectedCategory: "", newCategory: "", restaurantId: "" };
const emptyInspection = { kitchenClean: "pass", cookingAreaClean: "pass", storageProper: "pass", staffWearingGlovesCaps: "pass", wasteDisposalProper: "pass", packagingAreaHygienic: "pass", refrigerationProper: "pass", notes: "", statusAfterInspection: "pending", inspectedBy: "admin", nextInspectionDate: "" };
const emptyComplaintReview = { status: "in_review", resolutionNote: "", reviewedBy: "admin", triggeredReinspection: false };

const dateInput = (v) => (v ? String(v).slice(0, 10) : "");
const tagsToInput = (tags) => (Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : "");

export default function RestPanel() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("admin_token"), []);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState("safety");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [documents, setDocuments] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);
  const [inspectionForm, setInspectionForm] = useState(emptyInspection);
  const [documentForm, setDocumentForm] = useState({ type: DOC_TYPES[0], label: "", file: null, uploadedBy: "admin" });
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [complaintReview, setComplaintReview] = useState(emptyComplaintReview);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [addForm, setAddForm] = useState(emptyDish);
  const [updateForm, setUpdateForm] = useState(emptyDish);
  const [editingDishId, setEditingDishId] = useState("");
  const [dishSearch, setDishSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isBootstrappingRestaurant, setIsBootstrappingRestaurant] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });
  const logout = async () => {
    const localToken = localStorage.getItem("admin_token");
    localStorage.removeItem("admin_token");
    if (isSignedIn) {
      await signOut();
    }
    navigate(localToken ? "/admin-login" : "/login");
  };
  const selectedRestaurant = restaurants.find((item) => item.id === selectedRestaurantId) || null;

  const fetchJson = async (url, options = {}) => {
    const localToken = localStorage.getItem("admin_token");
    const clerkToken = !localToken && isSignedIn ? await getToken() : null;
    const authHeaders =
      localToken || clerkToken
        ? { Authorization: `Bearer ${localToken || clerkToken}` }
        : {};

    const res = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
  };

  const loadRestaurants = async (preferredId = "") => {
    const data = await fetchJson(`${API_BASE}/api/restaurants`);
    setRestaurants(data || []);
    const nextId = preferredId || selectedRestaurantId || data?.[0]?.id || "";
    if (nextId) setSelectedRestaurantId(nextId);
  };

  const loadRestaurantDetails = async (restaurantId) => {
    if (!restaurantId) return;
    const [detail, history] = await Promise.all([
      fetchJson(`${API_BASE}/api/restaurants/${restaurantId}`),
      fetchJson(`${API_BASE}/api/restaurants/${restaurantId}/audit-history`)
    ]);
    setDocuments(detail.documents || []);
    setAuditHistory(history || []);
    setRestaurantForm({
      id: detail.id || "",
      name: detail.name || "",
      description: detail.description || "",
      location: detail.location || "",
      gstnNumber: detail.gstnNumber || "",
      fssaiLicenseNumber: detail.fssaiLicenseNumber || "",
      fssaiExpiryDate: dateInput(detail.fssaiExpiryDate),
      kitchenVerificationStatus: detail.kitchenVerificationStatus || "pending",
      lastInspectionDate: dateInput(detail.lastInspectionDate),
      nextInspectionDate: dateInput(detail.nextInspectionDate),
      packagingStatus: detail.packagingStatus || "unchecked",
      staffHygieneStatus: detail.staffHygieneStatus || "unchecked",
      foodHandlingStatus: detail.foodHandlingStatus || "unchecked",
      remarksByAdmin: detail.remarksByAdmin || "",
      verifiedBy: detail.verifiedBy || "admin"
    });
  };

  const loadComplaints = async () => {
    setComplaints(await fetchJson(`${API_BASE}/api/complaints`));
  };

  const loadDishes = async () => setDishes(await fetchJson(`${API_BASE}/api/dishes`));
  const loadCategories = async () => {
    const data = await fetchJson(`${API_BASE}/api/dishes/categories`);
    setCategories((data || []).filter((item) => item && item !== "All"));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token && !isLoaded) return;
    if (!token && !isSignedIn) return;
    loadRestaurants().catch(() => {});
    loadComplaints().catch(() => {});
    loadDishes().catch(() => {});
    loadCategories().catch(() => {});
  }, [isLoaded, isSignedIn, token]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (selectedRestaurantId) loadRestaurantDetails(selectedRestaurantId).catch(() => {}); }, [selectedRestaurantId]);
  useEffect(() => {
    if (!categories.length) return;
    setAddForm((prev) => ({ ...prev, selectedCategory: prev.selectedCategory || categories[0], restaurantId: prev.restaurantId || selectedRestaurantId || restaurants[0]?.id || "" }));
    setUpdateForm((prev) => ({ ...prev, selectedCategory: prev.selectedCategory || categories[0], restaurantId: prev.restaurantId || selectedRestaurantId || restaurants[0]?.id || "" }));
  }, [categories, selectedRestaurantId, restaurants]);

  useEffect(() => {
    if (token) return;
    if (!isLoaded || !isSignedIn || !user) return;
    if (restaurants.length > 0) return;
    if (isBootstrappingRestaurant) return;

    const meta = user.unsafeMetadata || {};
    const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
    const restaurantName = String(meta.restaurantName || "").trim();

    if (!restaurantName) return;

    setIsBootstrappingRestaurant(true);

    fetchJson(`${API_BASE}/api/restaurants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: restaurantName,
        gstnNumber: String(meta.gstnNumber || "").trim(),
        verifiedBy: String(meta.ownerName || primaryEmail || "restaurant_owner").trim(),
        ownerDisplayName: String(meta.ownerName || "").trim(),
        location: "",
        description: ""
      })
      })
      .then((data) => {
        showToast("success", "Restaurant profile created", `${data.name} is now linked to this account.`);
        return loadRestaurants(data.id);
      })
      .catch(() => {})
      .finally(() => setIsBootstrappingRestaurant(false));
  }, [isBootstrappingRestaurant, isLoaded, isSignedIn, restaurants.length, token, user]);

  const saveRestaurant = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson(`${API_BASE}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantForm)
      });
      showToast("success", "Restaurant saved", `${data.name} updated.`);
      await loadRestaurants(data.id);
      await loadRestaurantDetails(data.id);
      await loadDishes();
    } catch (err) { showToast("error", "Save failed", err.message); }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedRestaurantId || !documentForm.file) return showToast("error", "Missing file", "Choose a restaurant and file first.");
    const fd = new FormData();
    Object.entries(documentForm).forEach(([k, v]) => v != null && fd.append(k, v));
    try {
      await fetchJson(`${API_BASE}/api/restaurants/${selectedRestaurantId}/documents`, { method: "POST", body: fd });
      showToast("success", "Document uploaded", "Compliance document saved.");
      setDocumentForm({ type: documentForm.type, label: "", file: null, uploadedBy: "admin" });
      await loadRestaurants(selectedRestaurantId);
      await loadRestaurantDetails(selectedRestaurantId);
    } catch (err) { showToast("error", "Upload failed", err.message); }
  };

  const submitInspection = async (e) => {
    e.preventDefault();
    if (!selectedRestaurantId) return showToast("error", "Choose restaurant", "Select a restaurant first.");
    try {
      const data = await fetchJson(`${API_BASE}/api/restaurants/${selectedRestaurantId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inspectionForm)
      });
      showToast("success", "Inspection submitted", `Score ${data?.safety?.totalScore ?? 0} / 100`);
      await loadRestaurants(selectedRestaurantId);
      await loadRestaurantDetails(selectedRestaurantId);
      await loadComplaints();
    } catch (err) { showToast("error", "Inspection failed", err.message); }
  };

  const buildDishFormData = (form, category) => {
    const fd = new FormData();
    [["name", form.name.trim()], ["description", form.description], ["price", form.price], ["category", category], ["prepTime", form.prepTime], ["tags", form.tags], ["isBestseller", String(form.isBestseller)], ["restaurantId", form.restaurantId || selectedRestaurantId || ""]].forEach(([k, v]) => fd.append(k, v));
    if (form.image) fd.append("image", form.image);
    return fd;
  };

  const saveDish = async (e, mode) => {
    e.preventDefault();
    const form = mode === "add" ? addForm : updateForm;
    const category = form.categoryMode === "new" ? form.newCategory.trim() : form.selectedCategory.trim();
    if (!form.name.trim() || !form.price || !category) return showToast("error", "Missing fields", "Name, price and category are required.");
    if (mode === "add" && !form.image) return showToast("error", "Image required", "Please upload an image.");
    try {
      const url = mode === "add" ? `${API_BASE}/api/dishes` : `${API_BASE}/api/dishes/${editingDishId}`;
      const method = mode === "add" ? "POST" : "PUT";
      const data = await fetchJson(url, { method, body: buildDishFormData(form, category) });
      showToast("success", mode === "add" ? "Dish added" : "Dish updated", `${data.name} saved.`);
      await loadDishes();
      await loadCategories();
      if (mode === "add") setAddForm({ ...emptyDish, selectedCategory: categories[0] || "", restaurantId: selectedRestaurantId || restaurants[0]?.id || "" });
      if (mode === "update") setEditingDishId(data.id);
    } catch (err) { showToast("error", "Dish save failed", err.message); }
  };

  const selectDish = (dish) => {
    const category = (dish.category || "").trim();
    const useExisting = categories.includes(category);
    setEditingDishId(dish.id || dish._id);
    setUpdateForm({ name: dish.name || "", description: dish.description || "", price: dish.price ?? "", image: null, prepTime: dish.prepTime || "25-35 min", tags: tagsToInput(dish.tags), isBestseller: Boolean(dish.isBestseller), categoryMode: useExisting ? "existing" : "new", selectedCategory: useExisting ? category : categories[0] || "", newCategory: useExisting ? "" : category, restaurantId: dish.restaurantId || dish.restaurant?.id || selectedRestaurantId || "" });
    setActiveTab("update");
  };

    const reviewComplaint = async (e) => {
    e.preventDefault();
    try {
      await fetchJson(`${API_BASE}/api/complaints/${selectedComplaintId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(complaintReview) });
      showToast("success", "Complaint updated", "Review saved.");
      setSelectedComplaintId("");
      setComplaintReview(emptyComplaintReview);
      await loadComplaints();
      if (selectedRestaurantId) { await loadRestaurants(selectedRestaurantId); await loadRestaurantDetails(selectedRestaurantId); }
    } catch (err) { showToast("error", "Complaint update failed", err.message); }
  };

  const deleteDish = async () => {
    try {
      await fetchJson(`${API_BASE}/api/dishes/${deleteTarget.id || deleteTarget._id}`, { method: "DELETE" });
      showToast("success", "Dish deleted", `${deleteTarget.name} removed.`);
      setDeleteTarget(null);
      await loadDishes();
    } catch (err) { showToast("error", "Delete failed", err.message); }
  };

  const filteredDishes = dishes.filter((dish) => {
    const q = dishSearch.trim().toLowerCase();
    return !q || (dish.name || "").toLowerCase().includes(q) || (dish.category || "").toLowerCase().includes(q);
  });

  return (
    <div className="admin-panel-page">
      <div className="container admin-panel-shell">
        <header className="admin-panel-header"><div><div className="admin-badge">KK Control</div><h1>Restaurant safety and operations control</h1><p>Manage safety profiles, compliance documents, inspections, complaints, and menu assignment.</p></div><div className="admin-panel-actions"><button className="btn btn-primary" onClick={() => window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")}>Delivery portal</button><button className="btn admin-secondary-button" onClick={logout}>Logout</button></div></header>
        <section className="admin-panel-body">
          <aside className="admin-side-panel">{[["safety", "Restaurant Safety"], ["complaints", "Complaints"], ["add", "Add Dish"], ["update", "Update Dish"], ["remove", "Remove Dish"]].map(([key, label]) => <button key={key} type="button" className={`admin-tab-button ${activeTab === key ? "is-active" : ""}`} onClick={() => setActiveTab(key)}>{label}</button>)}</aside>
          <div className="admin-content-panel">
            {activeTab === "safety" ? (
              <div className="admin-remove-shell">
                <div className="admin-form-header"><h2>Restaurant safety profile</h2><p>Select a restaurant, update compliance fields, upload documents, and submit inspection results.</p></div>
                <div className="admin-restaurant-list">{restaurants.map((item) => <button key={item.id} type="button" className={`admin-restaurant-card ${selectedRestaurantId === item.id ? "is-selected" : ""}`} onClick={() => setSelectedRestaurantId(item.id)}><strong>{item.name}</strong><span>{item.kitchenVerificationStatus.replaceAll("_", " ")}</span><small>Score {item.hygieneScore || 0} / 100</small></button>)}{token ? <button type="button" className="btn admin-secondary-button admin-button-full" onClick={() => { setSelectedRestaurantId(""); setRestaurantForm(emptyRestaurant); setDocuments([]); setAuditHistory([]); }}>New restaurant</button> : null}</div>
                <form onSubmit={saveRestaurant} className="admin-form admin-grid-form">
                  {["name", "location", "gstnNumber", "fssaiLicenseNumber", "verifiedBy"].map((field) => <label key={field} className="admin-field"><span>{field}</span><input value={restaurantForm[field]} onChange={(e) => setRestaurantForm((p) => ({ ...p, [field]: e.target.value }))} /></label>)}
                  <label className="admin-field"><span>FSSAI expiry date</span><input type="date" value={restaurantForm.fssaiExpiryDate} onChange={(e) => setRestaurantForm((p) => ({ ...p, fssaiExpiryDate: e.target.value }))} /></label>
                  <label className="admin-field"><span>Verification status</span><select value={restaurantForm.kitchenVerificationStatus} onChange={(e) => setRestaurantForm((p) => ({ ...p, kitchenVerificationStatus: e.target.value }))}>{STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
                  <label className="admin-field"><span>Last inspection date</span><input type="date" value={restaurantForm.lastInspectionDate} onChange={(e) => setRestaurantForm((p) => ({ ...p, lastInspectionDate: e.target.value }))} /></label>
                  <label className="admin-field"><span>Next inspection date</span><input type="date" value={restaurantForm.nextInspectionDate} onChange={(e) => setRestaurantForm((p) => ({ ...p, nextInspectionDate: e.target.value }))} /></label>
                  {["packagingStatus", "staffHygieneStatus", "foodHandlingStatus"].map((field) => <label key={field} className="admin-field"><span>{field}</span><select value={restaurantForm[field]} onChange={(e) => setRestaurantForm((p) => ({ ...p, [field]: e.target.value }))}>{QUALITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label>)}
                  <label className="admin-field admin-field-full"><span>Description</span><textarea rows={3} value={restaurantForm.description} onChange={(e) => setRestaurantForm((p) => ({ ...p, description: e.target.value }))} /></label>
                  <label className="admin-field admin-field-full"><span>Remarks by admin</span><textarea rows={3} value={restaurantForm.remarksByAdmin} onChange={(e) => setRestaurantForm((p) => ({ ...p, remarksByAdmin: e.target.value }))} /></label>
                  <button className="btn btn-primary admin-button-full">{restaurantForm.id ? "Update restaurant" : "Create restaurant"}</button>
                </form>
                {selectedRestaurant ? <div className="admin-score-strip"><div className="admin-score-card"><span>Score</span><strong>{selectedRestaurant.hygieneScore || 0}</strong><small>{selectedRestaurant.scoreBand || "poor"}</small></div><div className="admin-score-card"><span>Status</span><strong>{selectedRestaurant.kitchenVerificationStatus.replaceAll("_", " ")}</strong><small>{selectedRestaurant.documentCount || 0} documents</small></div><div className="admin-score-card"><span>Open complaints</span><strong>{selectedRestaurant.openComplaintCount || 0}</strong><small>{selectedRestaurant.badges?.recentlyAudited ? "Recently audited" : "Audit due"}</small></div></div> : null}
                <form onSubmit={uploadDocument} className="admin-form admin-grid-form"><div className="admin-form-header"><h2>Document upload</h2><p>FSSAI, kitchen photos, inspection reports, pest control proof, staff hygiene proof, and any compliance file.</p></div><label className="admin-field"><span>Type</span><select value={documentForm.type} onChange={(e) => setDocumentForm((p) => ({ ...p, type: e.target.value }))}>{DOC_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}</select></label><label className="admin-field"><span>Label</span><input value={documentForm.label} onChange={(e) => setDocumentForm((p) => ({ ...p, label: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>File</span><input type="file" onChange={(e) => setDocumentForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></label><button className="btn btn-primary admin-button-full">Upload document</button></form>
                <div className="admin-document-list">{documents.length ? documents.map((doc) => <a key={doc.id} className="admin-document-card" href={doc.fileUrl} target="_blank" rel="noreferrer"><strong>{doc.label || doc.type}</strong><span>{doc.type.replaceAll("_", " ")}</span><small>{new Date(doc.createdAt).toLocaleDateString()}</small></a>) : <div className="admin-empty-state">No compliance documents yet.</div>}</div>
                <form onSubmit={submitInspection} className="admin-form admin-grid-form"><div className="admin-form-header"><h2>Inspection checklist</h2><p>Record inspection outcomes and let the system recalculate the hygiene score.</p></div>{CHECKS.map(([key, label]) => <label key={key} className="admin-field"><span>{label}</span><select value={inspectionForm[key]} onChange={(e) => setInspectionForm((p) => ({ ...p, [key]: e.target.value }))}><option value="pass">pass</option><option value="partial">partial</option><option value="fail">fail</option></select></label>)}<label className="admin-field"><span>Status after inspection</span><select value={inspectionForm.statusAfterInspection} onChange={(e) => setInspectionForm((p) => ({ ...p, statusAfterInspection: e.target.value }))}>{STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}</select></label><label className="admin-field"><span>Inspector</span><input value={inspectionForm.inspectedBy} onChange={(e) => setInspectionForm((p) => ({ ...p, inspectedBy: e.target.value }))} /></label><label className="admin-field"><span>Next inspection date</span><input type="date" value={inspectionForm.nextInspectionDate} onChange={(e) => setInspectionForm((p) => ({ ...p, nextInspectionDate: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Notes</span><textarea rows={3} value={inspectionForm.notes} onChange={(e) => setInspectionForm((p) => ({ ...p, notes: e.target.value }))} /></label><button className="btn btn-primary admin-button-full">Submit inspection</button></form>
                <div className="admin-audit-list">{auditHistory.length ? auditHistory.map((item) => <div key={item.id} className="admin-audit-card"><strong>{item.actionType.replaceAll("_", " ")}</strong><span>{item.changedBy} / {new Date(item.createdAt).toLocaleString()}</span><small>Score {item.previousScore ?? "-"} to {item.newScore ?? "-"} / Status {item.previousStatus || "-"} to {item.newStatus || "-"}</small></div>) : <div className="admin-empty-state">No audit history yet.</div>}</div>
              </div>
            ) : null}
            {activeTab === "complaints" ? (
              <div className="admin-remove-shell">
                <div className="admin-form-header"><h2>Complaint review</h2><p>Review hygiene complaints and trigger reinspection when needed.</p></div>
                <div className="admin-complaint-list">{complaints.map((item) => <button key={item.id} type="button" className={`admin-complaint-card ${selectedComplaintId === item.id ? "is-selected" : ""}`} onClick={() => { setSelectedComplaintId(item.id); setComplaintReview({ status: item.status || "in_review", resolutionNote: item.resolutionNote || "", reviewedBy: "admin", triggeredReinspection: Boolean(item.triggeredReinspection) }); }}><strong>{item.complaintType.replaceAll("_", " ")}</strong><span>{item.restaurant?.name || "Unknown restaurant"}</span><small>{item.status.replaceAll("_", " ")}</small></button>)}</div>
                {selectedComplaintId ? <form onSubmit={reviewComplaint} className="admin-form admin-grid-form"><label className="admin-field"><span>Status</span><select value={complaintReview.status} onChange={(e) => setComplaintReview((p) => ({ ...p, status: e.target.value }))}>{["open", "in_review", "resolved", "reinspection_triggered", "rejected"].map((v) => <option key={v} value={v}>{v}</option>)}</select></label><label className="admin-field"><span>Reviewed by</span><input value={complaintReview.reviewedBy} onChange={(e) => setComplaintReview((p) => ({ ...p, reviewedBy: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Resolution note</span><textarea rows={4} value={complaintReview.resolutionNote} onChange={(e) => setComplaintReview((p) => ({ ...p, resolutionNote: e.target.value }))} /></label><label className="admin-checkbox"><input type="checkbox" checked={complaintReview.triggeredReinspection} onChange={(e) => setComplaintReview((p) => ({ ...p, triggeredReinspection: e.target.checked }))} /><span>Trigger reinspection</span></label><button className="btn btn-primary admin-button-full">Save review</button></form> : <div className="admin-empty-state">Select a complaint to review it.</div>}
              </div>
            ) : null}
            {["add", "update", "remove"].includes(activeTab) ? (
              <div className="admin-remove-shell">
                <div className="admin-form-header"><h2>{activeTab === "add" ? "Add dish" : activeTab === "update" ? "Update dishes" : "Remove dishes"}</h2><p>Assign dishes to restaurants so the customer app can show trust and safety metadata with each menu item.</p></div>
                {activeTab !== "add" ? <div className="admin-search-row"><input className="admin-search-input" value={dishSearch} onChange={(e) => setDishSearch(e.target.value)} placeholder="Search by name or category" /><button className="btn admin-secondary-button" onClick={() => loadDishes().catch(() => {})}>Refresh</button></div> : null}
                {activeTab === "add" || editingDishId ? <form onSubmit={(e) => saveDish(e, activeTab === "add" ? "add" : "update")} className="admin-form admin-grid-form"><label className="admin-field admin-field-full"><span>Dish name</span><input value={(activeTab === "add" ? addForm : updateForm).name} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, name: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Description</span><textarea rows={4} value={(activeTab === "add" ? addForm : updateForm).description} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, description: e.target.value }))} /></label><label className="admin-field"><span>Price</span><input type="number" value={(activeTab === "add" ? addForm : updateForm).price} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, price: e.target.value }))} /></label><label className="admin-field"><span>Restaurant</span><select value={(activeTab === "add" ? addForm : updateForm).restaurantId} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, restaurantId: e.target.value }))}>{restaurants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="admin-field"><span>Category mode</span><select value={(activeTab === "add" ? addForm : updateForm).categoryMode} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, categoryMode: e.target.value }))}><option value="existing">existing</option><option value="new">new</option></select></label>{((activeTab === "add" ? addForm : updateForm).categoryMode === "existing") ? <label className="admin-field"><span>Category</span><select value={(activeTab === "add" ? addForm : updateForm).selectedCategory} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, selectedCategory: e.target.value }))}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label> : <label className="admin-field"><span>New category</span><input value={(activeTab === "add" ? addForm : updateForm).newCategory} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, newCategory: e.target.value }))} /></label>}<label className="admin-field"><span>Prep time</span><input value={(activeTab === "add" ? addForm : updateForm).prepTime} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, prepTime: e.target.value }))} /></label><label className="admin-field admin-field-full"><span>Tags</span><input value={(activeTab === "add" ? addForm : updateForm).tags} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, tags: e.target.value }))} /></label><label className="admin-checkbox"><input type="checkbox" checked={(activeTab === "add" ? addForm : updateForm).isBestseller} onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, isBestseller: e.target.checked }))} /><span>Highlight as bestseller</span></label><label className="admin-field admin-field-full"><span>{activeTab === "add" ? "Dish image" : "Replace dish image"}</span><input type="file" accept="image/*" onChange={(e) => (activeTab === "add" ? setAddForm : setUpdateForm)((p) => ({ ...p, image: e.target.files?.[0] || null }))} /></label><button className="btn btn-primary admin-button-full">{activeTab === "add" ? "Save dish" : "Update dish"}</button></form> : <div className="admin-empty-state">Pick a dish below to edit it.</div>}
                {activeTab !== "add" ? <div className="admin-dish-list">{filteredDishes.map((dish) => <div key={dish.id || dish._id} className={`admin-dish-row ${editingDishId === (dish.id || dish._id) ? "is-selected" : ""}`}><div><div className="admin-dish-name">{dish.name}</div><div className="admin-dish-meta">{dish.category} / Rs {dish.price} / {dish.restaurant?.name || "No restaurant"}</div></div>{activeTab === "remove" ? <button type="button" className="btn admin-danger-button" onClick={() => setDeleteTarget(dish)}>Delete</button> : <button type="button" className="btn admin-secondary-button" onClick={() => selectDish(dish)}>Edit</button>}</div>)}</div> : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
      <Toast open={toast.open} type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast((t) => ({ ...t, open: false }))} />
      {deleteTarget ? <div className="confirm-dialog-backdrop" role="presentation"><div className="confirm-dialog-card" role="dialog" aria-modal="true"><div className="confirm-dialog-badge">Delete dish</div><h3 className="confirm-dialog-title">Confirm deletion</h3><p className="confirm-dialog-text">Delete <strong>{deleteTarget.name}</strong> from the live menu?</p><div className="confirm-dialog-actions"><button type="button" className="btn admin-secondary-button" onClick={() => setDeleteTarget(null)}>No</button><button type="button" className="btn admin-danger-button" onClick={deleteDish}>Yes, delete</button></div></div></div> : null}
    </div>
  );
}
