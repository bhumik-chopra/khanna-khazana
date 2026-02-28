import React from 'react';
import { TESTIMONIALS } from '../data';

const Testimonials = () => {
  return (
    <section className="section" id="testimonials">
      <div className="container">
        <div className="section-header">
          <p className="badge">Love from the Khazana family</p>
          <h2 className="section-title">Foodies who keep coming back</h2>
          <p className="section-subtitle">
            Real people, real cravings, real stories.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.2rem 1.1rem',
                boxShadow: 'var(--shadow-soft)',
                margin: 0
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>“</div>
              <blockquote
                style={{
                  margin: 0,
                  marginBottom: '0.8rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.92rem'
                }}
              >
                {t.text}
              </blockquote>
              <figcaption
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
                <div style={{ color: '#008c4a', fontWeight: 600 }}>Verified foodie ✔</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
