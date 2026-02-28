import React from 'react';

const Navbar = ({ cartCount, onCartClick }) => {
  return (
    <header
      style={{
        background: 'linear-gradient(90deg, #ff7a1a 0%, #ff9f1c 50%, #008c4a 100%)',
        color: 'var(--white)',
        position: 'sticky',
        top: 0,
        zIndex: 20
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}
          >
            KK
          </div>
          <div>
            <div style={{ fontWeight: 800, letterSpacing: '0.03em' }}>
              Khanna Khazana
            </div>
            <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>
              Desi Swad. Smart Delivery.
            </div>
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            fontSize: '0.9rem'
          }}
        >
          <a href="#menu" style={{ color: 'var(--white)', textDecoration: 'none' }}>
            Menu
          </a>
          <a href="#how-it-works" style={{ color: 'var(--white)', textDecoration: 'none' }}>
            How it works
          </a>
          <a href="#testimonials" style={{ color: 'var(--white)', textDecoration: 'none' }}>
            Love from foodies
          </a>

          <button
            className="btn"
            style={{
              background: 'var(--white)',
              color: '#ff7a1a',
              paddingInline: '1.1rem'
            }}
            onClick={onCartClick}
          >
            🛒 Cart
            {cartCount > 0 && (
              <span
                style={{
                  background: '#ff7a1a',
                  color: 'var(--white)',
                  borderRadius: '999px',
                  padding: '0.1rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
