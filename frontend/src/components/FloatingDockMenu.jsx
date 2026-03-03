import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dock from './Dock';

const FloatingDockMenu = ({ cartCount = 0, onCartClick }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current && y > 120) setVisible(false);
      else setVisible(true);
      lastY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const TextIcon = ({ text }) => (
    <div
      style={{
        fontSize: 12,
        fontWeight: 900,
        color: '#111',
        paddingInline: 10,
        whiteSpace: 'nowrap'
      }}
    >
      {text}
    </div>
  );

  // ✅ HowItWorks removed from dock
  const items = [
    {
      label: 'Home',
      icon: <TextIcon text="Home" />,
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      label: 'Menu',
      icon: <TextIcon text="Menu" />,
      onClick: () => scrollTo('menu')
    },
    {
      label: 'Login',
      icon: <TextIcon text="Login" />,
      onClick: () =>{window.open("https://khanna-khazana-5.onrender.com", "_blank")}
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: 10, // ✅ fixed to top of window
        transform: `translate(-50%, 0)`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 220ms ease',
        zIndex: 9999 // ✅ can sit over navbar
      }}
    >
      {/* ✅ Color schema wrapper */}
      <div
        style={{
          borderRadius: 999,
          padding: 6,
          background: 'linear-gradient(90deg, rgba(255,122,26,0.95), rgba(255,255,255,0.92), rgba(0,140,74,0.95))',
          boxShadow: '0 16px 40px rgba(0,0,0,0.18)'
        }}
      >
        <div
          style={{
            borderRadius: 999,
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '4px 8px'
          }}
        >
          {/* ✅ NO hover animation: magnification = baseItemSize */}
  <Dock
  items={items}
  baseItemSize={100}     // smaller buttons
  magnification={500}    // bigger pop
  panelHeight={60}      // smaller box
  distance={240}
/>
        </div>
      </div>
    </div>
  );
};

export default FloatingDockMenu;