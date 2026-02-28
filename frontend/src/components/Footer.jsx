import React from 'react';

const Footer = () => {
  return (
    <footer
      style={{
        marginTop: 'auto',
        background:
          'linear-gradient(90deg, rgba(255,122,26,0.1), rgba(255,255,255,0.9), rgba(0,140,74,0.1))',
        borderTop: '1px solid rgba(0,0,0,0.03)'
      }}
    >
      <div
        className="container"
        style={{
          padding: '1.2rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '0.8rem',
          fontSize: '0.8rem',
          alignItems: 'center'
        }}
      >
        <div>
          © {new Date().getFullYear()} <strong>Khanna Khazana</strong>. All rights
          reserved.
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Made with ❤️ for foodies everywhere.</span>
          <span style={{ fontWeight: 600, color: '#008c4a' }}>India · Orange · White · Green</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
