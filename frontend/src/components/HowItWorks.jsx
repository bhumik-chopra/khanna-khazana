import React from 'react';

const steps = [
  {
    icon: '📱',
    title: 'Choose your cravings',
    text: 'Browse our curated menu of regional Indian favourites and pick what your heart (and stomach) wants.'
  },
  {
    icon: '🧑‍🍳',
    title: 'We cook it fresh',
    text: 'Our partner kitchens start prepping your order the moment you place it – no pre-cooked compromise.'
  },
  {
    icon: '🚚',
    title: 'Track live delivery',
    text: 'Real-time tracking from kitchen to doorstep with smart ETAs tailored to your location.'
  },
  {
    icon: '😋',
    title: 'Relish & repeat',
    text: 'Enjoy restaurant-grade meals at home and reorder your favourites in one tap next time.'
  }
];

const HowItWorks = () => {
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <p className="badge">How Khanna Khazana works</p>
          <h2 className="section-title">From craving to plate in four simple steps</h2>
          <p className="section-subtitle">
            Designed to feel as simple as calling your favourite local tiffin —
            but a lot more reliable and transparent.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {steps.map((step, index) => (
            <div
              key={step.title}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.2rem 1.1rem',
                boxShadow: 'var(--shadow-soft)',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '1.4rem',
                  marginBottom: '0.6rem'
                }}
              >
                {step.icon}
              </div>
              <h3
                style={{
                  margin: 0,
                  marginBottom: '0.35rem',
                  fontSize: '1rem'
                }}
              >
                {index + 1}. {step.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
