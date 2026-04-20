/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";
const VERIFICATION_DOCUMENTS = [
  { key: "fssaiCertificateFile", type: "fssai_certificate", label: "FSSAI Certificate" },
  { key: "kitchenCookingAreaPhoto", type: "kitchen_cooking_area_photo", label: "Kitchen Photo - Cooking Area" },
  { key: "kitchenPreparationAreaPhoto", type: "kitchen_preparation_area_photo", label: "Kitchen Photo - Preparation Area" },
  { key: "kitchenStorageAreaPhoto", type: "kitchen_storage_area_photo", label: "Kitchen Photo - Storage Area" },
  { key: "kitchenUtensilsCleaningAreaPhoto", type: "kitchen_utensils_cleaning_area_photo", label: "Kitchen Photo - Utensils/Cleaning Area" },
  { key: "staffHygienePhoto", type: "staff_hygiene_photo", label: "Staff hygiene photo" },
  { key: "storageFridgePhoto", type: "storage_fridge_photo", label: "Storage/Fridge photo" },
  { key: "packagingPhoto", type: "packaging_photo", label: "Packaging photo" },
  { key: "pestControlProofFile", type: "pest_control_proof", label: "Pest control proof" }
];
const VERIFICATION_SECTIONS = [
  { id: "basic_business", label: "Basic Business Details", description: "Contact number and restaurant address." },
  { id: "legal_compliance", label: "Legal and Compliance", description: "GSTN, FSSAI number, expiry, and certificate upload." },
  { id: "kitchen_proof", label: "Kitchen Proof", description: "Mandatory kitchen proof images for all key areas." },
  { id: "staff_hygiene", label: "Staff Hygiene", description: "Protective gear confirmation and optional staff photo." },
  { id: "food_handling", label: "Food Handling and Storage", description: "Storage separation, fridge proof, and temperature confirmation." },
  { id: "packaging_safety", label: "Packaging Safety", description: "Packaging type, packaging photo, and tamper-safe confirmation." },
  { id: "pest_control", label: "Pest Control and Cleanliness", description: "Pest control date, proof, and waste disposal method." },
  { id: "water_safety", label: "Water and Ingredient Safety", description: "Water source and clean-water confirmation." },
  { id: "self_declaration", label: "Self Declaration", description: "Final declaration confirming food safety standards." }
];
const SECTION_DOCUMENT_KEYS = {
  legal_compliance: ["fssaiCertificateFile"],
  kitchen_proof: [
    "kitchenCookingAreaPhoto",
    "kitchenPreparationAreaPhoto",
    "kitchenStorageAreaPhoto",
    "kitchenUtensilsCleaningAreaPhoto"
  ],
  staff_hygiene: ["staffHygienePhoto"],
  food_handling: ["storageFridgePhoto"],
  packaging_safety: ["packagingPhoto"],
  pest_control: ["pestControlProofFile"]
};

const emptyRestaurant = {
  id: "",
  name: "",
  ownerName: "",
  contactNumber: "",
  restaurantAddress: "",
  gstnNumber: "",
  fssaiLicenseNumber: "",
  fssaiExpiryDate: "",
  staffUsesProtectiveGear: false,
  rawAndCookedStoredSeparately: false,
  temperatureMaintainedProperly: false,
  packagingType: "",
  sealedPackaging: false,
  lastPestControlDate: "",
  wasteDisposalMethod: "",
  waterSource: "RO",
  cleanWaterUsedForCooking: false,
  selfDeclarationAccepted: false,
  kitchenVerificationStatus: "pending",
  lastInspectionDate: "",
  nextInspectionDate: "",
  packagingStatus: "unchecked",
  staffHygieneStatus: "unchecked",
  foodHandlingStatus: "unchecked",
  remarksByAdmin: "",
  verifiedBy: "admin"
};
const emptyDish = { name: "", description: "", price: "", image: null, prepTime: "25-35 min", tags: "", isBestseller: false, categoryMode: "existing", selectedCategory: "", newCategory: "", restaurantId: "" };
const emptyComplaintReview = { status: "in_review", resolutionNote: "", reviewedBy: "admin", triggeredReinspection: false };
const emptyVerificationFiles = {
  fssaiCertificateFile: null,
  kitchenCookingAreaPhoto: null,
  kitchenPreparationAreaPhoto: null,
  kitchenStorageAreaPhoto: null,
  kitchenUtensilsCleaningAreaPhoto: null,
  staffHygienePhoto: null,
  storageFridgePhoto: null,
  packagingPhoto: null,
  pestControlProofFile: null
};

const dateInput = (v) => (v ? String(v).slice(0, 10) : "");
const tagsToInput = (tags) => (Array.isArray(tags) ? tags.join(", ") : typeof tags === "string" ? tags : "");
const humanizeStatus = (value) => String(value || "pending").replaceAll("_", " ");
const formatDisplayDate = (value) => {
  if (!value) return "Not available yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available yet";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};
const getStatusTone = (status) => {
  if (status === "verified") return "approved";
  if (status === "rejected" || status === "expired") return "attention";
  if (status === "needs_reinspection") return "review";
  return "pending";
};
const getStatusMessage = (status) => {
  if (status === "verified") {
    return "Your restaurant is approved and visible as verified in the platform.";
  }
  if (status === "rejected") {
    return "Your last submission was not approved. Review the admin remarks, update the details, and send it again.";
  }
  if (status === "needs_reinspection") {
    return "A fresh review is needed before the restaurant can return to a verified state.";
  }
  if (status === "expired") {
    return "Some compliance details have expired. Update them and resubmit for review.";
  }
  return "Your submission is under review. You can still open the form and update any section if needed.";
};

export default function RestPanel() {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("admin_token"), []);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState("safety");
  const [selectedVerificationSection, setSelectedVerificationSection] = useState("basic_business");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [restaurantForm, setRestaurantForm] = useState(emptyRestaurant);
  const [verificationFiles, setVerificationFiles] = useState(emptyVerificationFiles);
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
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isApprovalStatusOpen, setIsApprovalStatusOpen] = useState(true);
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
  const approvalStatus = restaurantForm.kitchenVerificationStatus || selectedRestaurant?.kitchenVerificationStatus || "pending";
  const approvalTone = getStatusTone(approvalStatus);
  const displayRestaurantName =
    selectedRestaurant?.name ||
    restaurantForm.name ||
    String(user?.unsafeMetadata?.restaurantName || "").trim() ||
    "Restaurant";
  const displayOwnerName =
    restaurantForm.ownerName ||
    String(user?.unsafeMetadata?.ownerName || "").trim() ||
    selectedRestaurant?.ownerName ||
    selectedRestaurant?.ownerDisplayName ||
    "Owner";

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
    const detail = await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}`);
    setRestaurantForm({
      id: detail.id || "",
      name: detail.name || "",
      ownerName: detail.ownerName || detail.ownerDisplayName || "",
      contactNumber: detail.contactNumber || "",
      restaurantAddress: detail.restaurantAddress || detail.location || "",
      gstnNumber: detail.gstnNumber || "",
      fssaiLicenseNumber: detail.fssaiLicenseNumber || "",
      fssaiExpiryDate: dateInput(detail.fssaiExpiryDate),
      staffUsesProtectiveGear: Boolean(detail.staffUsesProtectiveGear),
      rawAndCookedStoredSeparately: Boolean(detail.rawAndCookedStoredSeparately),
      temperatureMaintainedProperly: Boolean(detail.temperatureMaintainedProperly),
      packagingType: detail.packagingType || "",
      sealedPackaging: Boolean(detail.sealedPackaging),
      lastPestControlDate: dateInput(detail.lastPestControlDate),
      wasteDisposalMethod: detail.wasteDisposalMethod || "",
      waterSource: detail.waterSource || "RO",
      cleanWaterUsedForCooking: Boolean(detail.cleanWaterUsedForCooking),
      selfDeclarationAccepted: Boolean(detail.selfDeclarationAccepted),
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
    setIsApprovalStatusOpen(approvalStatus !== "verified");
  }, [approvalStatus, selectedRestaurantId]);
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
        ownerName: String(meta.ownerName || "").trim(),
        gstnNumber: String(meta.gstnNumber || "").trim(),
        verifiedBy: String(meta.ownerName || primaryEmail || "restaurant_owner").trim(),
        ownerDisplayName: String(meta.ownerName || "").trim(),
        restaurantAddress: "",
        location: ""
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
    if (isSubmittingVerification) return;

    if (!restaurantForm.name.trim() && selectedVerificationSection !== "basic_business") {
      showToast("error", "Basic details first", "Please submit basic business details first.");
      return;
    }

    if (selectedVerificationSection === "self_declaration" && !restaurantForm.selfDeclarationAccepted) {
      showToast("error", "Declaration required", "Please confirm the self declaration before submitting.");
      return;
    }
    try {
      setIsSubmittingVerification(true);
      const data = await fetchJson(`${API_BASE}/api/restaurants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...restaurantForm,
          location: restaurantForm.restaurantAddress,
          ownerDisplayName: restaurantForm.ownerName
        })
      });
      await uploadVerificationDocuments(data.id, selectedVerificationSection);
      const sectionLabel = VERIFICATION_SECTIONS.find((item) => item.id === selectedVerificationSection)?.label || "Section";
      showToast("success", "Section saved", `${sectionLabel} submitted for ${data.name}.`);
      await loadRestaurants(data.id);
      await loadRestaurantDetails(data.id);
      await loadDishes();
    } catch (err) {
      showToast("error", "Save failed", err.message);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const uploadVerificationDocuments = async (restaurantId, sectionId) => {
    const allowedKeys = new Set(SECTION_DOCUMENT_KEYS[sectionId] || []);
    const uploads = VERIFICATION_DOCUMENTS.filter(({ key }) => allowedKeys.has(key) && verificationFiles[key]);
    if (!uploads.length) return;

    for (const item of uploads) {
      const fd = new FormData();
      fd.append("type", item.type);
      fd.append("label", item.label);
      fd.append("file", verificationFiles[item.key]);
      fd.append("uploadedBy", token ? "admin" : (user?.primaryEmailAddress?.emailAddress || "restaurant_owner"));
      await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}/documents`, { method: "POST", body: fd });
    }

    setVerificationFiles((prev) => {
      const next = { ...prev };
      uploads.forEach(({ key }) => {
        next[key] = null;
      });
      return next;
    });
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
        <header className="admin-panel-header"><div><div className="admin-badge">KK Control</div><div className="admin-panel-subheading">Restaurant safety and operations control</div><div className="admin-panel-identity"><div className="admin-panel-identity-item"><span>Restaurant</span><strong>{displayRestaurantName}</strong></div><div className="admin-panel-identity-divider" aria-hidden="true" /><div className="admin-panel-identity-item"><span>Owner</span><strong>{displayOwnerName}</strong></div></div></div><div className="admin-panel-actions"><button className="btn btn-primary" onClick={() => window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")}>Delivery portal</button><button className="btn admin-secondary-button" onClick={logout}>Logout</button></div></header>
        <section className="admin-panel-body">
          <aside className="admin-side-panel">{[["safety", "Restaurant Safety"], ["complaints", "Complaints"], ["add", "Add Dish"], ["update", "Update Dish"], ["remove", "Remove Dish"]].map(([key, label]) => <button key={key} type="button" className={`admin-tab-button ${activeTab === key ? "is-active" : ""}`} onClick={() => setActiveTab(key)}>{label}</button>)}</aside>
          <div className="admin-content-panel">
            {activeTab === "safety" ? (
              <div className="admin-remove-shell">
                <button
                  type="button"
                  className={`admin-status-card admin-status-card-${approvalTone} ${isApprovalStatusOpen ? "is-open" : ""}`}
                  onClick={() => setIsApprovalStatusOpen((current) => !current)}
                >
                  <div className="admin-status-card-topline">
                    <div>
                      <div className="admin-badge">Approval Status</div>
                      <div className="admin-status-title">{humanizeStatus(approvalStatus)}</div>
                    </div>
                    <span className="admin-status-toggle">{isApprovalStatusOpen ? "Hide" : "Open"}</span>
                  </div>
                  <p>{getStatusMessage(approvalStatus)}</p>
                  <div className="admin-status-meta">
                    <div>
                      <span>Admin remarks</span>
                      <strong>{restaurantForm.remarksByAdmin || "No remarks yet."}</strong>
                    </div>
                    <div>
                      <span>Last verified</span>
                      <strong>{formatDisplayDate(selectedRestaurant?.lastVerifiedDate)}</strong>
                    </div>
                    <div>
                      <span>Hygiene score</span>
                      <strong>{selectedRestaurant?.hygieneScore || 0}</strong>
                    </div>
                  </div>
                  <small className="admin-status-hint">
                    Click this box to {isApprovalStatusOpen ? "collapse" : "expand"} the update and resend form.
                  </small>
                </button>
                {isApprovalStatusOpen ? (
                  <>
                <div className="admin-form-header"><h2>Restaurant verification submission</h2><p>Submit only the required restaurant verification details, compliance proof, and kitchen safety uploads.</p></div>
                <div className="admin-form admin-grid-form">
                  <div className="admin-form-header">
                    <h2>Choose submission heading</h2>
                    <p>Select one heading and submit that section separately. Any new update from the restaurant side is sent back for admin review.</p>
                  </div>
                  <label className="admin-field admin-field-full">
                    <span>Submission heading</span>
                    <select value={selectedVerificationSection} onChange={(e) => setSelectedVerificationSection(e.target.value)}>
                      {VERIFICATION_SECTIONS.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}
                    </select>
                  </label>
                </div>
                <form onSubmit={saveRestaurant} className="admin-form admin-grid-form">
                  <div className="admin-form-header"><h2>{VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.label}</h2><p>{VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.description}</p></div>
                  {selectedVerificationSection === "basic_business" ? <>
                    {[
                      ["contactNumber", "Contact Number"],
                      ["restaurantAddress", "Restaurant Address"]
                    ].map(([field, label]) => <label key={field} className={`admin-field ${field === "restaurantAddress" ? "admin-field-full" : ""}`}><span>{label}</span>{field === "restaurantAddress" ? <textarea rows={3} value={restaurantForm[field]} onChange={(e) => setRestaurantForm((p) => ({ ...p, [field]: e.target.value }))} /> : <input value={restaurantForm[field]} onChange={(e) => setRestaurantForm((p) => ({ ...p, [field]: e.target.value }))} />}</label>)}
                  </> : null}
                  {selectedVerificationSection === "legal_compliance" ? <>
                    <label className="admin-field"><span>GSTN Number</span><input value={restaurantForm.gstnNumber} onChange={(e) => setRestaurantForm((p) => ({ ...p, gstnNumber: e.target.value }))} /></label>
                    <label className="admin-field"><span>FSSAI License Number</span><input value={restaurantForm.fssaiLicenseNumber} onChange={(e) => setRestaurantForm((p) => ({ ...p, fssaiLicenseNumber: e.target.value }))} /></label>
                    <label className="admin-field"><span>FSSAI expiry date</span><input type="date" value={restaurantForm.fssaiExpiryDate} onChange={(e) => setRestaurantForm((p) => ({ ...p, fssaiExpiryDate: e.target.value }))} /></label>
                    <label className="admin-field admin-field-full"><span>FSSAI Certificate</span><input type="file" accept="image/*,.pdf" onChange={(e) => setVerificationFiles((p) => ({ ...p, fssaiCertificateFile: e.target.files?.[0] || null }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "kitchen_proof" ? <>
                    <label className="admin-field"><span>Kitchen Photo - Cooking Area</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, kitchenCookingAreaPhoto: e.target.files?.[0] || null }))} /></label>
                    <label className="admin-field"><span>Kitchen Photo - Preparation Area</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, kitchenPreparationAreaPhoto: e.target.files?.[0] || null }))} /></label>
                    <label className="admin-field"><span>Kitchen Photo - Storage Area</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, kitchenStorageAreaPhoto: e.target.files?.[0] || null }))} /></label>
                    <label className="admin-field"><span>Kitchen Photo - Utensils/Cleaning Area</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, kitchenUtensilsCleaningAreaPhoto: e.target.files?.[0] || null }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "staff_hygiene" ? <>
                    <label className="admin-field"><span>Staff uses gloves, caps, aprons</span><select value={restaurantForm.staffUsesProtectiveGear ? "yes" : "no"} onChange={(e) => setRestaurantForm((p) => ({ ...p, staffUsesProtectiveGear: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                    <label className="admin-field"><span>Staff hygiene photo</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, staffHygienePhoto: e.target.files?.[0] || null }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "food_handling" ? <>
                    <label className="admin-field"><span>Raw and cooked food stored separately</span><select value={restaurantForm.rawAndCookedStoredSeparately ? "yes" : "no"} onChange={(e) => setRestaurantForm((p) => ({ ...p, rawAndCookedStoredSeparately: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                    <label className="admin-field"><span>Temperature maintained properly</span><select value={restaurantForm.temperatureMaintainedProperly ? "yes" : "no"} onChange={(e) => setRestaurantForm((p) => ({ ...p, temperatureMaintainedProperly: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                    <label className="admin-field admin-field-full"><span>Storage/Fridge photo</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, storageFridgePhoto: e.target.files?.[0] || null }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "packaging_safety" ? <>
                    <label className="admin-field"><span>Type of packaging used</span><input value={restaurantForm.packagingType} onChange={(e) => setRestaurantForm((p) => ({ ...p, packagingType: e.target.value }))} /></label>
                    <label className="admin-field"><span>Sealed / tamper-safe packaging</span><select value={restaurantForm.sealedPackaging ? "yes" : "no"} onChange={(e) => setRestaurantForm((p) => ({ ...p, sealedPackaging: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                    <label className="admin-field admin-field-full"><span>Packaging photo</span><input type="file" accept="image/*" onChange={(e) => setVerificationFiles((p) => ({ ...p, packagingPhoto: e.target.files?.[0] || null }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "pest_control" ? <>
                    <label className="admin-field"><span>Last pest control date</span><input type="date" value={restaurantForm.lastPestControlDate} onChange={(e) => setRestaurantForm((p) => ({ ...p, lastPestControlDate: e.target.value }))} /></label>
                    <label className="admin-field"><span>Pest control proof</span><input type="file" accept="image/*,.pdf" onChange={(e) => setVerificationFiles((p) => ({ ...p, pestControlProofFile: e.target.files?.[0] || null }))} /></label>
                    <label className="admin-field admin-field-full"><span>Waste disposal method</span><textarea rows={3} value={restaurantForm.wasteDisposalMethod} onChange={(e) => setRestaurantForm((p) => ({ ...p, wasteDisposalMethod: e.target.value }))} /></label>
                  </> : null}
                  {selectedVerificationSection === "water_safety" ? <>
                    <label className="admin-field"><span>Water source</span><select value={restaurantForm.waterSource} onChange={(e) => setRestaurantForm((p) => ({ ...p, waterSource: e.target.value }))}><option value="RO">RO</option><option value="Filtered">Filtered</option><option value="Municipal">Municipal</option></select></label>
                    <label className="admin-field"><span>Clean water used for cooking</span><select value={restaurantForm.cleanWaterUsedForCooking ? "yes" : "no"} onChange={(e) => setRestaurantForm((p) => ({ ...p, cleanWaterUsedForCooking: e.target.value === "yes" }))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                  </> : null}
                  {selectedVerificationSection === "self_declaration" ? <>
                    <label className="admin-checkbox"><input type="checkbox" checked={restaurantForm.selfDeclarationAccepted} onChange={(e) => setRestaurantForm((p) => ({ ...p, selfDeclarationAccepted: e.target.checked }))} /><span>I confirm that all provided information is true and the kitchen follows food safety standards.</span></label>
                  </> : null}
                  <button className={`btn btn-primary admin-button-full ${isSubmittingVerification ? "is-loading" : ""}`} disabled={isSubmittingVerification}>
                    {isSubmittingVerification ? "Sending details..." : `Submit ${VERIFICATION_SECTIONS.find((section) => section.id === selectedVerificationSection)?.label}`}
                  </button>
                </form>
                  </>
                ) : null}
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
