import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ComplaintModal from "./ComplaintModal";

const SECTION_DETAIL_BUILDERS = {
  basic_business: (restaurant) => [
    restaurant.contactNumber ? `Contact number: ${restaurant.contactNumber}` : "",
    restaurant.restaurantAddress || restaurant.location ? `Restaurant address: ${restaurant.restaurantAddress || restaurant.location}` : ""
  ],
  legal_compliance: (restaurant) => [
    restaurant.fssaiLicenseNumber ? `FSSAI number: ${restaurant.fssaiLicenseNumber}` : "",
    restaurant.gstnNumber ? `GSTN number: ${restaurant.gstnNumber}` : "",
    restaurant.fssaiExpiryDate ? `FSSAI expiry: ${new Date(restaurant.fssaiExpiryDate).toLocaleDateString()}` : ""
  ],
  kitchen_proof: () => ["Kitchen proof approved"],
  staff_hygiene: (restaurant) => [
    `Protective gear used: ${restaurant.staffUsesProtectiveGear ? "Yes" : "No"}`
  ],
  food_handling: (restaurant) => [
    `Raw and cooked stored separately: ${restaurant.rawAndCookedStoredSeparately ? "Yes" : "No"}`,
    `Temperature maintained properly: ${restaurant.temperatureMaintainedProperly ? "Yes" : "No"}`
  ],
  packaging_safety: (restaurant) => [
    restaurant.packagingType ? `Packaging type: ${restaurant.packagingType}` : "",
    `Sealed packaging: ${restaurant.sealedPackaging ? "Yes" : "No"}`
  ],
  pest_control: (restaurant) => [
    restaurant.lastPestControlDate ? `Last pest control: ${new Date(restaurant.lastPestControlDate).toLocaleDateString()}` : "",
    restaurant.wasteDisposalMethod ? `Waste disposal: ${restaurant.wasteDisposalMethod}` : ""
  ],
  water_safety: (restaurant) => [
    restaurant.waterSource ? `Water source: ${restaurant.waterSource}` : "",
    `Clean water used for cooking: ${restaurant.cleanWaterUsedForCooking ? "Yes" : "No"}`
  ],
  self_declaration: (restaurant) => [
    `Self declaration accepted: ${restaurant.selfDeclarationAccepted ? "Yes" : "No"}`
  ]
};

const getApprovedHeadingDetails = (restaurant) =>
  (restaurant.headingSafety?.approvedSections || [])
    .map((section) => ({
      ...section,
      details: (SECTION_DETAIL_BUILDERS[section.id]?.(restaurant) || []).filter(Boolean)
    }))
    .filter((section) => section.details.length > 0);

const RestaurantDetailPage = ({ apiBase }) => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiBase}/api/restaurants/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Restaurant not available");
        return data;
      })
      .then((data) => setRestaurant(data))
      .catch(() => setRestaurant(null))
      .finally(() => setIsLoading(false));
  }, [apiBase, id]);

  if (isLoading || !restaurant) {
    return (
      <div className="app-shell">
        <main className="site-main">
          <section className="section">
            <div className="container">
              <Link to="/" className="btn btn-outline">
                Back to kitchens
              </Link>
              <p className="section-subtitle">
                {isLoading ? "Loading restaurant safety profile..." : "Restaurant safety profile is not available."}
              </p>
              {isLoading ? <div className="kk-loading-state">Fetching safety details...</div> : null}
            </div>
          </section>
        </main>
      </div>
    );
  }

  const headingDetails = getApprovedHeadingDetails(restaurant);
  const headingScore = restaurant.headingSafety?.score ?? restaurant.hygieneScore ?? 0;

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
                {headingScore}
              </div>
            </div>

            <div className="restaurant-detail-grid">
              <div className="restaurant-detail-card">
                <h3>Heading approval snapshot</h3>
                <ul className="restaurant-detail-list">
                  <li>Approved headings: {restaurant.headingSafety?.approved || 0} of {restaurant.headingSafety?.total || 0}</li>
                  <li>Submitted headings: {restaurant.headingSafety?.submitted || 0} of {restaurant.headingSafety?.total || 0}</li>
                  <li>Heading score: {headingScore}</li>
                </ul>
              </div>

              <div className="restaurant-detail-card">
                <h3>Approved heading details</h3>
                <div className="restaurant-heading-detail-list">
                  {headingDetails.map((section) => (
                    <section key={section.id} className="restaurant-heading-detail">
                      <h4>{section.label}</h4>
                      <ul className="restaurant-detail-list">
                        {section.details.map((detail) => <li key={detail}>{detail}</li>)}
                      </ul>
                    </section>
                  ))}
                </div>
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
