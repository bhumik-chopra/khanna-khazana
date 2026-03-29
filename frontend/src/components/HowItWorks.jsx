import React from "react";

const steps = [
  {
    icon: "01",
    title: "Choose your cravings",
    text: "Browse curated dishes, from smoky gravies to crunchy street-food favourites."
  },
  {
    icon: "02",
    title: "Kitchens fire up",
    text: "Partner kitchens start fresh prep instantly so every order feels just-made."
  },
  {
    icon: "03",
    title: "Track every move",
    text: "Live visibility keeps the whole delivery loop feeling fast, clear, and premium."
  },
  {
    icon: "04",
    title: "Relish and repeat",
    text: "Save favourites, reorder quickly, and stay inside one polished food flow."
  }
];

const HowItWorks = () => {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <p className="badge badge-glass">How Khanna Khazana works</p>
          <h2 className="section-title">From craving to plate in four simple steps</h2>
          <p className="section-subtitle">
            Built to feel smooth, modern, and dependable from first tap to final bite.
          </p>
        </div>

        <div className="process-grid">
          {steps.map((step) => (
            <div key={step.title} className="process-card">
              <div className="process-card-index">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
