import React from 'react';

const Navbar = ({ onCartClick }) => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

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
        <div>
          <div style={{ fontWeight: 900, letterSpacing: '0.03em', fontSize: '1.1rem' }}>
            Khanna Khazana
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
            Desi Swad. Smart Delivery.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
          {/* ✅ How it works moved here */}
          <button
            className="btn"
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'var(--white)',
              paddingInline: '1.0rem',
              border: '1px solid rgba(255,255,255,0.25)'
            }}
            onClick={() => scrollTo('how-it-works')}
          >
            How it works
          </button>

          <button
            className="btn"
            style={{
              background: 'var(--white)',
              color: '#ff7a1a',
              paddingInline: '1.1rem'
            }}
            onClick={onCartClick}
          >
            Cart
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;