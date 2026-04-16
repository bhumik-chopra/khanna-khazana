import React from "react";
import { Link } from "react-router-dom";

const badgeLabels = [
  ["verifiedKitchen", "Verified Kitchen"],
  ["hygieneChecked", "Hygiene Checked"],
  ["recentlyAudited", "Recently Audited"]
];

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
            {restaurant.hygieneScore || 0}
          </div>
        </div>

        <p className="restaurant-card-copy">
          {restaurant.description || "Food safety profile maintained with active inspection and document review."}
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
            <dt>Packaging</dt>
            <dd>{restaurant.packagingStatus || "unchecked"}</dd>
          </div>
          <div>
            <dt>Last audit</dt>
            <dd>{restaurant.lastInspectionDate ? new Date(restaurant.lastInspectionDate).toLocaleDateString() : "Not yet"}</dd>
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
