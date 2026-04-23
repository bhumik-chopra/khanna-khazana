import React from "react";
import { Link } from "react-router-dom";

const badgeLabels = [
  ["verifiedKitchen", "All Documents Approved"],
  ["safePackaging", "Packaging Approved"]
];

const headingCount = (restaurant) => {
  const approved = restaurant.headingSafety?.approved ?? 0;
  const total = restaurant.headingSafety?.total ?? 0;
  return `${approved}/${total}`;
};

const RestaurantGrid = ({ restaurants, onReport }) => (
  <div className="restaurant-grid">
    {restaurants.map((restaurant) => (
      <article key={restaurant.id} className="restaurant-card">
        <div className="restaurant-card-top">
          <div>
            <span className="restaurant-card-kicker">KK Control Safety</span>
            <h3>{restaurant.name}</h3>
          </div>
          <div className={`restaurant-score-badge is-${restaurant.scoreBand || "poor"}`}>
            {restaurant.headingSafety?.score ?? restaurant.hygieneScore ?? 0}
          </div>
        </div>

        <p className="restaurant-card-copy">
          {restaurant.description || "Safety profile based on submitted documents approved by KK Control."}
        </p>

        <div className="restaurant-badge-list">
          {badgeLabels
            .filter(([key]) => restaurant.badges?.[key])
            .map(([, label]) => (
              <span key={label} className="restaurant-badge">
                {label}
              </span>
            ))}
        </div>

        <dl className="restaurant-stat-list">
          <div>
            <dt>FSSAI</dt>
            <dd>{restaurant.fssaiLicenseNumber || "Awaiting upload"}</dd>
          </div>
          <div>
            <dt>Approved documents</dt>
            <dd>{headingCount(restaurant)}</dd>
          </div>
          <div>
            <dt>Safety basis</dt>
            <dd>Documents</dd>
          </div>
        </dl>

        <div className="restaurant-card-actions">
          <Link className="btn btn-primary" to={`/restaurants/${restaurant.id}`}>
            View safety page
          </Link>
          <button type="button" className="btn btn-outline" onClick={() => onReport(restaurant)}>
            Report issue
          </button>
        </div>
      </article>
    ))}
  </div>
);

export default RestaurantGrid;
