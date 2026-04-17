import React from "react";

const Hero = ({ onOrderClick }) => {
  return (
    <section className="section hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <h1 className="hero-title">
            Crave-worthy food.
            <span> Verified kitchens. Zero guesswork.</span>
          </h1>

          <p className="hero-text">
            Khana Khazana shows you what other apps don't - real kitchen safety, hygiene
            checks, and trusted partners - so you know exactly where your food comes from.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOrderClick}>
              Start your order
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                const el = document.getElementById("menu");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Browse menu
            </button>
          </div>

          <div className="hero-trust-row">
            <div className="hero-trust-chip">
              <strong>Verified Kitchens</strong>
              <span>Trusted restaurant partners</span>
            </div>
            <div className="hero-trust-chip">
              <strong>Hygiene Checked</strong>
              <span>Cleaner prep and compliance visibility</span>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-card">
              <strong>30k+</strong>
              <span>Orders delivered</span>
            </div>
            <div className="hero-stat-card">
              <strong>4.7 star</strong>
              <span>Foodie rating</span>
            </div>
            <div className="hero-stat-card">
              <strong>35 min</strong>
              <span>Average ETA</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-floating-chip hero-floating-chip-top">
            <span className="hero-floating-chip-icon" aria-hidden="true">
              ✅
            </span>
            <span>Verified Kitchen</span>
          </div>

          <div className="hero-image-shell">
            <img
              src="https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&w=1200"
              alt="Indian food spread"
              className="hero-image"
            />
            <div className="hero-floating-chip hero-floating-chip-bottom">
              <span className="hero-floating-chip-icon" aria-hidden="true">
                🧼
              </span>
              <span>Hygiene Checked</span>
            </div>
          </div>

          <div className="hero-panel-grid">
            <div className="hero-panel-card hero-panel-card-orange">
              <span className="hero-panel-kicker">Hot route</span>
              <strong>Live order tracker</strong>
              <p>Follow every order from active kitchen prep to final doorstep handoff.</p>
            </div>
            <div className="hero-panel-card hero-panel-card-green">
              <span className="hero-panel-kicker">Kitchen sync</span>
              <strong>Trusted partner kitchens</strong>
              <p>Built for taste consistency, cleaner prep flow, and dependable quality.</p>
            </div>
          </div>

          <div className="hero-banner">
            <div>
              <span className="hero-banner-chip">Chef-curated</span>
              <strong>Menus tuned weekly for comfort, crunch, and signature spice.</strong>
            </div>
            <span className="hero-banner-offer">Free delivery on your first 3 orders</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
