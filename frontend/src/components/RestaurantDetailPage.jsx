import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ComplaintModal from "./ComplaintModal";

const RestaurantDetailPage = ({ apiBase }) => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    fetch(`${apiBase}/api/restaurants/${id}`)
      .then((res) => res.json())
      .then((data) => setRestaurant(data))
      .catch(() => setRestaurant(null));
  }, [apiBase, id]);

  if (!restaurant) {
    return (
      <div className="app-shell">
        <main className="site-main">
          <section className="section">
            <div className="container">
              <Link to="/" className="btn btn-outline">
                Back to kitchens
              </Link>
              <p className="section-subtitle">Loading restaurant safety profile...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="site-main">
        <section className="section restaurant-detail-section">
          <div className="container restaurant-detail-shell">
            <Link to="/" className="btn btn-outline">
              Back to kitchens
            </Link>
            <div className="restaurant-detail-hero">
              <div>
                <span className="badge badge-glass">Restaurant Safety</span>
                <h1 className="section-title">{restaurant.name}</h1>
                <p className="section-subtitle">
                  {restaurant.description || "Customer-facing hygiene and compliance profile from KK Control."}
                </p>
              </div>
              <div className={`restaurant-score-badge is-${restaurant.scoreBand || "poor"} is-large`}>
                {restaurant.hygieneScore || 0}
              </div>
            </div>

            <div className="restaurant-detail-grid">
              <div className="restaurant-detail-card">
                <h3>Safety snapshot</h3>
                <ul className="restaurant-detail-list">
                  <li>FSSAI number: {restaurant.fssaiLicenseNumber || "Awaiting upload"}</li>
                  <li>Last verified date: {restaurant.lastVerifiedDate ? new Date(restaurant.lastVerifiedDate).toLocaleDateString() : "Pending"}</li>
                  <li>Packaging safety: {restaurant.packagingStatus || "unchecked"}</li>
                  <li>Staff hygiene checked: {restaurant.staffHygieneStatus || "unchecked"}</li>
                  <li>Food handling: {restaurant.foodHandlingStatus || "unchecked"}</li>
                  <li>Valid food license: {restaurant.fssaiExpiryDate ? (new Date(restaurant.fssaiExpiryDate) >= new Date() ? "Yes" : "Expired") : "Unknown"}</li>
                </ul>
              </div>

              <div className="restaurant-detail-card">
                <h3>Inspection and documents</h3>
                <ul className="restaurant-detail-list">
                  <li>Last inspection date: {restaurant.lastInspectionDate ? new Date(restaurant.lastInspectionDate).toLocaleDateString() : "Not available"}</li>
                  <li>Next inspection date: {restaurant.nextInspectionDate ? new Date(restaurant.nextInspectionDate).toLocaleDateString() : "Not scheduled"}</li>
                  <li>Compliance documents: {restaurant.documents?.length || 0}</li>
                  <li>Open complaints: {restaurant.openComplaintCount || 0}</li>
                </ul>
                <button type="button" className="btn btn-primary" onClick={() => setReportOpen(true)}>
                  Report safety issue
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <ComplaintModal
        open={reportOpen}
        restaurant={restaurant}
        apiBase={apiBase}
        onClose={() => setReportOpen(false)}
        onSubmitted={() => {}}
      />
    </div>
  );
};

export default RestaurantDetailPage;
