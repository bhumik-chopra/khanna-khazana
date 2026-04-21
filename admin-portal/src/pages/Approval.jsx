import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";
const REVIEWER_NAME = "platform_admin";
const APPROVAL_REFRESH_MS = 7000;
const SECTION_DEFINITIONS = [
  { id: "basic_business", label: "Basic Business Details", details: [{ type: "field", field: "contactNumber", label: "Contact number" }, { type: "field", field: "restaurantAddress", label: "Restaurant address" }] },
  { id: "legal_compliance", label: "Legal and Compliance", details: [{ type: "field", field: "gstnNumber", label: "GSTN number" }, { type: "field", field: "fssaiLicenseNumber", label: "FSSAI number" }, { type: "field", field: "fssaiExpiryDate", label: "FSSAI expiry date" }, { type: "document", docType: "fssai_certificate", label: "FSSAI certificate" }] },
  { id: "kitchen_proof", label: "Kitchen Proof", details: [{ type: "document", docType: "kitchen_cooking_area_photo", label: "Cooking area photo" }, { type: "document", docType: "kitchen_preparation_area_photo", label: "Preparation area photo" }, { type: "document", docType: "kitchen_storage_area_photo", label: "Storage area photo" }, { type: "document", docType: "kitchen_utensils_cleaning_area_photo", label: "Utensils/cleaning area photo" }] },
  { id: "staff_hygiene", label: "Staff Hygiene", details: [{ type: "boolean", field: "staffUsesProtectiveGear", label: "Protective gear used" }, { type: "document", docType: "staff_hygiene_photo", label: "Staff hygiene photo" }] },
  { id: "food_handling", label: "Food Handling and Storage", details: [{ type: "boolean", field: "rawAndCookedStoredSeparately", label: "Raw and cooked stored separately" }, { type: "boolean", field: "temperatureMaintainedProperly", label: "Temperature maintained properly" }, { type: "document", docType: "storage_fridge_photo", label: "Storage/fridge photo" }] },
  { id: "packaging_safety", label: "Packaging Safety", details: [{ type: "field", field: "packagingType", label: "Packaging type" }, { type: "boolean", field: "sealedPackaging", label: "Sealed packaging" }, { type: "document", docType: "packaging_photo", label: "Packaging photo" }] },
  { id: "pest_control", label: "Pest Control and Cleanliness", details: [{ type: "field", field: "lastPestControlDate", label: "Last pest control date" }, { type: "field", field: "wasteDisposalMethod", label: "Waste disposal method" }, { type: "document", docType: "pest_control_proof", label: "Pest control proof" }] },
  { id: "water_safety", label: "Water and Ingredient Safety", details: [{ type: "field", field: "waterSource", label: "Water source" }, { type: "boolean", field: "cleanWaterUsedForCooking", label: "Clean water used for cooking" }] },
  { id: "self_declaration", label: "Self Declaration", details: [{ type: "boolean", field: "selfDeclarationAccepted", label: "Self declaration accepted" }] }
];
const STATUS_PRIORITY = { pending: 0, rejected: 1, verified: 2, expired: 3, needs_reinspection: 4 };
const SECTION_STATUS_LABELS = { draft: "Not Submitted", pending: "Pending", rejected: "Rejected", approved: "Passed" };

const formatValue = (value, type) => {
  if (!value && value !== false) return "Not submitted";
  if (type === "boolean") return value ? "Yes" : "No";
  if (String(value).match(/^\d{4}-\d{2}-\d{2}/)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }
  }
  return String(value);
};

function sortRestaurants(items = []) {
  return [...items].sort((a, b) => {
    const left = STATUS_PRIORITY[a.kitchenVerificationStatus] ?? 99;
    const right = STATUS_PRIORITY[b.kitchenVerificationStatus] ?? 99;
    if (left !== right) return left - right;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export default function Approval() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [expandedSectionId, setExpandedSectionId] = useState("");
  const [sectionRemarks, setSectionRemarks] = useState({});
  const [savingSectionId, setSavingSectionId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });
  const detailRequestRef = useRef(0);

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });
  const adminToken = localStorage.getItem("admin_token");

  const fetchJson = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Request failed");
    return data;
  }, [adminToken]);

  const loadRestaurants = useCallback(async (preferredId = "") => {
    const data = sortRestaurants(await fetchJson(`${API_BASE}/api/restaurants`));
    setRestaurants(data);
    setSelectedRestaurantId((current) => preferredId || current || data[0]?.id || "");
    return data;
  }, [fetchJson]);

  const loadRestaurantDetail = useCallback(async (restaurantId, options = {}) => {
    const requestId = ++detailRequestRef.current;
    if (!restaurantId) {
      setSelectedRestaurant(null);
      return;
    }

    const detail = await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}`);
    if (requestId !== detailRequestRef.current) return;
    const nextRemarks = Object.fromEntries(
      SECTION_DEFINITIONS.map((section) => [
        section.id,
        detail.verificationSections?.[section.id]?.adminRemarks || ""
      ])
    );

    setSelectedRestaurant(detail);
    setSectionRemarks((current) => (options.preserveRemarks ? { ...nextRemarks, ...current } : nextRemarks));
  }, [fetchJson]);

  const pendingCount = useMemo(
    () => restaurants.filter((item) => item.kitchenVerificationStatus === "pending").length,
    [restaurants]
  );
  const selectedDisplayStatus = selectedRestaurant?.headingSafety?.allApproved
    ? "verified"
    : selectedRestaurant?.kitchenVerificationStatus || "pending";
  const selectedStatus = String(selectedDisplayStatus).replaceAll("_", " ");

  const submittedSections = useMemo(() => {
    const sectionStates = selectedRestaurant?.verificationSections || {};
    const documentMap = new Map((selectedRestaurant?.documents || []).map((doc) => [doc.type, doc]));

    return SECTION_DEFINITIONS
      .filter((section) => (sectionStates[section.id]?.status || "draft") !== "draft")
      .map((section) => ({
        ...section,
        status: sectionStates[section.id]?.status || "draft",
        adminRemarks: sectionStates[section.id]?.adminRemarks || "",
        details: section.details.map((item) => {
          if (item.type === "document") {
            const document = documentMap.get(item.docType);
            return {
              ...item,
              value: document?.fileUrl ? "Uploaded" : "Not available",
              link: document?.fileUrl || ""
            };
          }

          return {
            ...item,
            value: selectedRestaurant?.[item.field]
          };
        })
      }));
  }, [selectedRestaurant]);

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin-login", { replace: true });
      return;
    }

    setIsLoading(true);
    loadRestaurants()
      .catch((err) => showToast("error", "Load failed", err.message || "Could not fetch restaurants."))
      .finally(() => setIsLoading(false));
  }, [adminToken, loadRestaurants, navigate]);

  useEffect(() => {
    if (!selectedRestaurantId) return undefined;
    setIsDetailLoading(true);
    setExpandedSectionId("");
    loadRestaurantDetail(selectedRestaurantId)
      .catch((err) => showToast("error", "Detail failed", err.message || "Could not fetch restaurant details."))
      .finally(() => setIsDetailLoading(false));
    return undefined;
  }, [loadRestaurantDetail, selectedRestaurantId]);

  useEffect(() => {
    if (!adminToken) return undefined;

    let isCancelled = false;
    let timerId;

    const refreshApprovals = async () => {
      try {
        const data = await loadRestaurants(selectedRestaurantId);
        const nextSelectedId = selectedRestaurantId || data[0]?.id || "";
        if (!isCancelled && nextSelectedId) {
          await loadRestaurantDetail(nextSelectedId, { preserveRemarks: true });
        }
      } catch (err) {
        console.warn("approval auto-refresh failed:", err);
      } finally {
        if (!isCancelled) {
          timerId = window.setTimeout(refreshApprovals, APPROVAL_REFRESH_MS);
        }
      }
    };

    timerId = window.setTimeout(refreshApprovals, APPROVAL_REFRESH_MS);
    return () => {
      isCancelled = true;
      window.clearTimeout(timerId);
    };
  }, [adminToken, loadRestaurantDetail, loadRestaurants, selectedRestaurantId]);

  const handleSectionReview = async (sectionId, decision) => {
    if (!selectedRestaurantId || !sectionId) return;

    try {
      setSavingSectionId(sectionId);
      await fetchJson(`${API_BASE}/api/restaurants/${selectedRestaurantId}/sections/${sectionId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          adminRemarks: sectionRemarks[sectionId] || "",
          reviewedBy: REVIEWER_NAME
        })
      });
      await loadRestaurants(selectedRestaurantId);
      await loadRestaurantDetail(selectedRestaurantId);
      showToast("success", decision === "approve" ? "Heading accepted" : "Heading rejected", "The heading review has been updated.");
    } catch (err) {
      showToast("error", "Section review failed", err.message || "Could not review the heading.");
    } finally {
      setSavingSectionId("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="admin-panel-page">
      <div className="container admin-panel-shell admin-approval-desk-shell">
        <header className="admin-panel-header admin-approval-desk-header">
          <div>
            <div className="admin-badge">Admin Approval</div>
            <h1>Restaurant approval desk</h1>
            <p>Review each submitted heading one by one.</p>
            <div className="admin-panel-subheading">
              {pendingCount} pending review{pendingCount === 1 ? "" : "s"}
            </div>
          </div>

          <div className="admin-panel-actions">
            <Link to="/" className="btn admin-secondary-button">Back to entry</Link>
            <button type="button" className="btn admin-secondary-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="admin-panel-body">
          <aside className="admin-side-panel admin-approval-sidebar">
            <div className="admin-form-header">
              <h2>Submitted restaurants</h2>
              <p>Choose a restaurant to review its submitted headings.</p>
            </div>

            <div className="admin-restaurant-list">
              {restaurants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-restaurant-card ${selectedRestaurantId === item.id ? "is-selected" : ""}`}
                  onClick={() => {
                    if (item.id !== selectedRestaurantId) {
                      setSelectedRestaurant(null);
                    }
                    setSelectedRestaurantId(item.id);
                  }}
                >
                  <strong>{item.name}</strong>
                  <span>{item.ownerName || item.ownerDisplayName || "Owner not added"}</span>
                  <small className={`admin-status-mini admin-status-mini-${item.headingSafety?.allApproved ? "verified" : item.kitchenVerificationStatus || "pending"}`}>
                    {String(item.headingSafety?.allApproved ? "verified" : item.kitchenVerificationStatus || "pending").replaceAll("_", " ")}
                  </small>
                </button>
              ))}
            </div>
          </aside>

          <section className="admin-content-panel admin-approval-content-panel">
            {isLoading ? (
              <div className="admin-empty-state">Loading restaurant approvals...</div>
            ) : isDetailLoading && !selectedRestaurant ? (
              <div className="admin-empty-state">Loading selected restaurant...</div>
            ) : !selectedRestaurant ? (
              <div className="admin-empty-state">Pick a restaurant to review its headings.</div>
            ) : (
              <div className="admin-approval-view">
                <div className="admin-panel-block admin-approval-restaurant-summary">
                  <div>
                    <strong>{selectedRestaurant.name}</strong>
                    <span>{selectedRestaurant.ownerName || selectedRestaurant.ownerDisplayName || "Owner not provided"}</span>
                    <span>{selectedRestaurant.restaurantAddress || selectedRestaurant.location || "No address provided"}</span>
                  </div>
                  <div className="admin-approval-summary-pill">
                    <span>{submittedSections.length}</span>
                    <small>submitted heading{submittedSections.length === 1 ? "" : "s"}</small>
                  </div>
                  <div className={`admin-approval-summary-status admin-status-mini-${selectedDisplayStatus}`}>
                    {selectedStatus}
                  </div>
                </div>

                <div className="admin-approval-section-list">
                  {submittedSections.map((section) => (
                    <article key={section.id} className={`admin-approval-section-card admin-platform-approval-card admin-platform-approval-card-${section.status}`}>
                      <button
                        type="button"
                        className="admin-section-toggle"
                        onClick={() => setExpandedSectionId((current) => current === section.id ? "" : section.id)}
                      >
                        <div>
                          <strong>{section.label}</strong>
                          <span className={`admin-platform-status-pill admin-platform-status-pill-${section.status}`}>
                            {SECTION_STATUS_LABELS[section.status] || "Pending"}
                          </span>
                        </div>
                        <span className="admin-section-arrow">{expandedSectionId === section.id ? "▾" : "▸"}</span>
                      </button>

                      {expandedSectionId === section.id ? (
                        <div className="admin-approval-section-content">
                          <div className="admin-approval-item-list">
                            {section.details.map((item) => (
                              <div key={`${section.id}-${item.label}`} className="admin-review-item">
                                <div className="admin-review-item-topline">
                                  <strong>{item.label}</strong>
                                </div>
                                <p>{formatValue(item.value, item.type)}</p>
                                {item.link ? <a href={item.link} target="_blank" rel="noreferrer" className="admin-review-link">Open file</a> : null}
                              </div>
                            ))}
                          </div>

                          <label className="admin-field admin-field-full">
                            <span>Admin remarks</span>
                            <textarea
                              rows={3}
                              value={sectionRemarks[section.id] || ""}
                              onChange={(e) => setSectionRemarks((current) => ({ ...current, [section.id]: e.target.value }))}
                              placeholder="Add heading-specific feedback."
                            />
                          </label>

                          <div className="admin-approval-actions">
                            <button
                              type="button"
                              className={`btn btn-primary ${savingSectionId === section.id ? "is-loading" : ""}`}
                              disabled={Boolean(savingSectionId)}
                              onClick={() => handleSectionReview(section.id, "approve")}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="btn admin-danger-button"
                              disabled={Boolean(savingSectionId)}
                              onClick={() => handleSectionReview(section.id, "reject")}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ))}

                  {!submittedSections.length ? (
                    <div className="admin-empty-state">No submitted headings yet for this restaurant.</div>
                  ) : null}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}
