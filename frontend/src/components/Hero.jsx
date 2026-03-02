import React from 'react';

const Hero = ({ onOrderClick }) => {
  return (
    <section className="section" style={{ paddingTop: '2.8rem' }}>
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '2.5rem',
          alignItems: 'center'
        }}
      >
        {/* Left content */}
        <div>
          <span className="badge">🍛 Authentic Indian food, delivered fast</span>

          <h1
            style={{
              marginTop: '1rem',
              marginBottom: '0.75rem',
              fontSize: '2.7rem',
              lineHeight: 1.15
            }}
          >
            Your favourite{' '}
            <span style={{ color: '#ff7a1a' }}>khana</span> <br />
            is now just a tap away.
          </h1>

          <p style={{ color: 'var(--text-muted)', maxWidth: 520, marginBottom: '1.6rem' }}>
            From buttery North Indian curries to crisp South Indian dosas and
            iconic street food – Khanna Khazana brings the best of India to
            your doorstep in under 35 minutes.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOrderClick}>
              Order now
              <span>⚡</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                const el = document.getElementById('menu');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Browse full menu
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1.6rem',
              marginTop: '1.8rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              <strong style={{ color: 'var(--text-dark)' }}>30k+</strong>
              <div>Orders delivered</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-dark)' }}>4.7 ★</strong>
              <div>Average rating</div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-dark)' }}>35 min</strong>
              <div>Avg delivery time</div>
            </div>
          </div>
        </div>

        {/* Right visual card */}
        <div
          style={{
            background: 'var(--white)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-soft)',
            padding: '1.4rem 1.4rem 1.6rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 0% 0%, rgba(255,122,26,0.08), transparent 60%), radial-gradient(circle at 100% 100%, rgba(0,140,74,0.08), transparent 60%)',
              pointerEvents: 'none'
            }}
          />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}
            >
              <img
                src="https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&w=900"
                alt="Indian food spread"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
                gap: '0.75rem',
                fontSize: '0.78rem'
              }}
            >
              <div
                style={{
                  background: 'rgba(255,122,26,0.06)',
                  borderRadius: 12,
                  padding: '0.65rem 0.8rem'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Live order tracker
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Watch your food travel from kitchen to your doorstep.
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(0,140,74,0.06)',
                  borderRadius: 12,
                  padding: '0.65rem 0.8rem'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Pure veg & non-veg kitchens
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Separate kitchens. Same legendary flavour.
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem'
              }}
            >
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem' }}>🧑‍🍳</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Chef-curated menus</div>
                  <div style={{ color: 'var(--text-muted)' }}>Updated every week</div>
                </div>
              </div>
              <div>
                <span
                  style={{
                    background: 'linear-gradient(90deg, #ff7a1a, #008c4a)',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontWeight: 700
                  }}
                >
                  Free delivery on first 3 orders
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
