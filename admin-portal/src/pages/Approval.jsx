import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";
const REVIEWER_NAME = "platform_admin";

const STATUS_PRIORITY = {
  pending: 0,
  needs_reinspection: 1,
  rejected: 2,
  expired: 3,
  verified: 4
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
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });

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

  const pendingCount = useMemo(
    () => restaurants.filter((item) => item.kitchenVerificationStatus === "pending").length,
    [restaurants]
  );

  const loadRestaurants = useCallback(async (preferredId = "") => {
    const data = sortRestaurants(await fetchJson(`${API_BASE}/api/restaurants`));
    setRestaurants(data);
    const nextId = preferredId || selectedRestaurantId || data[0]?.id || "";
    setSelectedRestaurantId(nextId);
    return data;
  }, [fetchJson, selectedRestaurantId]);

  const loadRestaurantDetail = useCallback(async (restaurantId) => {
    if (!restaurantId) {
      setSelectedRestaurant(null);
      setRemarks("");
      return;
    }

    const detail = await fetchJson(`${API_BASE}/api/restaurants/${restaurantId}`);
    setSelectedRestaurant(detail);
    setRemarks(detail.remarksByAdmin || "");
  }, [fetchJson]);

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
    if (!selectedRestaurantId) return;
    loadRestaurantDetail(selectedRestaurantId).catch((err) =>
      showToast("error", "Detail failed", err.message || "Could not fetch restaurant details.")
    );
  }, [loadRestaurantDetail, selectedRestaurantId]);

  const handleReview = async (decision) => {
    if (!selectedRestaurantId) return;

    try {
      setIsSaving(true);
      const response = await fetchJson(`${API_BASE}/api/restaurants/${selectedRestaurantId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          remarksByAdmin: remarks,
          verifiedBy: REVIEWER_NAME
        })
      });

      await loadRestaurants(selectedRestaurantId);
      await loadRestaurantDetail(selectedRestaurantId);

      const updatedRestaurant = response.restaurant || {};
      showToast(
        "success",
        decision === "approve" ? "Restaurant approved" : "Restaurant rejected",
        decision === "approve"
          ? `${updatedRestaurant.name || "Restaurant"} is now live with score ${updatedRestaurant.hygieneScore || 0}.`
          : `${updatedRestaurant.name || "Restaurant"} has been sent back for changes.`
      );
    } catch (err) {
      showToast("error", "Review failed", err.message || "Could not complete the review.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin-login", { replace: true });
  };

  return (
    <div className="admin-panel-page">
      <div className="container admin-panel-shell">
        <header className="admin-panel-header">
          <div>
            <div className="admin-badge">Admin Approval</div>
            <h1>Restaurant approval desk</h1>
            <p>Review submitted restaurant data, approve it for the main app, and publish the calculated hygiene score after approval.</p>
            <div className="admin-panel-subheading">
              {pendingCount} pending review{pendingCount === 1 ? "" : "s"}
            </div>
          </div>

          <div className="admin-panel-actions">
            <Link to="/" className="btn admin-secondary-button">
              Back to entry
            </Link>
            <button type="button" className="btn admin-secondary-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-panel-body">
          <aside className="admin-side-panel">
            <div className="admin-form-header">
              <h2>Submitted restaurants</h2>
              <p>Pending and reinspection cases are pinned to the top.</p>
            </div>

            <div className="admin-restaurant-list">
              {restaurants.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`admin-restaurant-card ${selectedRestaurantId === item.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedRestaurantId(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.ownerName || item.ownerDisplayName || "Owner not added"}</span>
                  <small>{String(item.kitchenVerificationStatus || "pending").replaceAll("_", " ")}</small>
                </button>
              ))}

              {!restaurants.length && !isLoading ? (
                <div className="admin-empty-state">No restaurants are available for review right now.</div>
              ) : null}
            </div>
          </aside>

          <section className="admin-content-panel">
            {isLoading ? (
              <div className="admin-empty-state">Loading restaurant approvals...</div>
            ) : !selectedRestaurant ? (
              <div className="admin-empty-state">Pick a restaurant to review its submission.</div>
            ) : (
              <div className="admin-approval-shell">
                <div className="admin-score-strip">
                  <div className="admin-score-card">
                    <span>Status</span>
                    <strong>{String(selectedRestaurant.kitchenVerificationStatus || "pending").replaceAll("_", " ")}</strong>
                    <small>Current workflow state</small>
                  </div>
                  <div className="admin-score-card">
                    <span>Documents</span>
                    <strong>{selectedRestaurant.documents?.length || selectedRestaurant.documentCount || 0}</strong>
                    <small>Uploaded compliance files</small>
                  </div>
                  <div className="admin-score-card">
                    <span>Live score</span>
                    <strong>{selectedRestaurant.hygieneScore || 0}</strong>
                    <small>Visible only after approval</small>
                  </div>
                </div>

                <div className="admin-approval-grid">
                  <div className="admin-panel-block">
                    <strong>{selectedRestaurant.name}</strong>
                    <span>{selectedRestaurant.ownerName || selectedRestaurant.ownerDisplayName || "Owner not provided"}</span>
                    <span>{selectedRestaurant.contactNumber || "No contact number"}</span>
                    <span>{selectedRestaurant.restaurantAddress || selectedRestaurant.location || "No address provided"}</span>
                    <span>FSSAI: {selectedRestaurant.fssaiLicenseNumber || "Not submitted"}</span>
                    <span>GSTN: {selectedRestaurant.gstnNumber || "Not submitted"}</span>
                  </div>

                  <div className="admin-panel-block">
                    <strong>Operational checks</strong>
                    <span>Protective gear: {selectedRestaurant.staffUsesProtectiveGear ? "Yes" : "No"}</span>
                    <span>Food stored separately: {selectedRestaurant.rawAndCookedStoredSeparately ? "Yes" : "No"}</span>
                    <span>Temperature maintained: {selectedRestaurant.temperatureMaintainedProperly ? "Yes" : "No"}</span>
                    <span>Sealed packaging: {selectedRestaurant.sealedPackaging ? "Yes" : "No"}</span>
                    <span>Clean water used: {selectedRestaurant.cleanWaterUsedForCooking ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="admin-panel-block">
                  <strong>Uploaded documents</strong>
                  <div className="admin-document-list">
                    {(selectedRestaurant.documents || []).map((doc) => (
                      <a
                        key={doc.id}
                        className="admin-document-card"
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <strong>{doc.label || doc.type}</strong>
                        <span>{String(doc.type || "").replaceAll("_", " ")}</span>
                      </a>
                    ))}
                    {!selectedRestaurant.documents?.length ? (
                      <div className="admin-empty-state">No documents uploaded yet.</div>
                    ) : null}
                  </div>
                </div>

                <label className="admin-field admin-field-full">
                  <span>Admin remarks</span>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add approval notes or rejection feedback for the restaurant."
                  />
                </label>

                <div className="admin-approval-actions">
                  <button
                    type="button"
                    className={`btn btn-primary ${isSaving ? "is-loading" : ""}`}
                    disabled={isSaving}
                    onClick={() => handleReview("approve")}
                  >
                    Approve and publish score
                  </button>
                  <button
                    type="button"
                    className="btn admin-danger-button"
                    disabled={isSaving}
                    onClick={() => handleReview("reject")}
                  >
                    Reject submission
                  </button>
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
