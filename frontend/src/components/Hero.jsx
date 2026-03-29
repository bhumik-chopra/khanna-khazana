import React from "react";

const Hero = ({ onOrderClick }) => {
  return (
    <section className="section hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="badge badge-glass">Authentic Indian food, delivered at light speed</span>

          <h1 className="hero-title">
            Futuristic flavour systems for every
            <span> orange-hot craving.</span>
          </h1>

          <p className="hero-text">
            Khanna Khazana blends indulgent Indian comfort food with a polished delivery
            experience, rich motion, glowing highlights, and menu discovery that feels alive.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onOrderClick}>
              Launch order flow
              <span>+</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                const el = document.getElementById("menu");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Browse menu grid
            </button>
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

          <div className="hero-image-shell">
            <img
              src="https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&w=1200"
              alt="Indian food spread"
              className="hero-image"
            />
          </div>

          <div className="hero-panel-grid">
            <div className="hero-panel-card hero-panel-card-orange">
              <span className="hero-panel-kicker">Hot route</span>
              <strong>Live order tracker</strong>
              <p>From pan heat to doorstep glow with real-time delivery telemetry.</p>
            </div>
            <div className="hero-panel-card hero-panel-card-green">
              <span className="hero-panel-kicker">Kitchen sync</span>
              <strong>Separate veg and non-veg prep lanes</strong>
              <p>Built for trust, speed, and flavour integrity across every order.</p>
            </div>
          </div>

          <div className="hero-banner">
            <div>
              <span className="hero-banner-chip">Chef-curated</span>
              <strong>Menus tuned weekly for comfort, crunch, and spice.</strong>
            </div>
            <span className="hero-banner-offer">Free delivery on your first 3 orders</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
