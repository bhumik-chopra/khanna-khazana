import './App.css';
import React, { useMemo, useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import LoginModal from './components/LoginModal';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoryFilter from './components/CategoryFilter';
import DishGrid from './components/DishGrid';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Toast from './components/Toast';

import Dock from './components/Dock';

import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

//////////////////////////////////////////////////////////
// FLOATING DOCK COMPONENT
//////////////////////////////////////////////////////////
function FloatingDock({ onLoginClick }) {
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  // smooth show/hide animation on scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const current = window.scrollY;

        if (current < 80) {
          setVisible(true);
        } else if (current > lastScroll) {
          setVisible(false);
        } else {
          setVisible(true);
        }

        setLastScroll(current);
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScroll]);

  const items = [
    {
      label: 'Home',
      icon: <span>Home</span>,
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    {
      label: 'Menu',
      icon: <span>Menu</span>,
      onClick: () => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
    },
    {
      label: 'Login',
      icon: <span>Login</span>,
      onClick: onLoginClick
    }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: visible ? 'translate(-50%, 0px)' : 'translate(-50%, -120px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.45s cubic-bezier(.22,.61,.36,1), opacity 0.35s ease',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        <Dock items={items} magnification={60} baseItemSize={40} distance={140} panelHeight={64} />
      </div>
    </div>
  );
}

//////////////////////////////////////////////////////////
// MAIN SITE
//////////////////////////////////////////////////////////
function MainSite() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');

  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [toast, setToast] = useState({ open: false, type: 'success', title: '', message: '' });
  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  /////////////////////////////////////
  // LOAD DISHES FROM API
  /////////////////////////////////////
  const loadDishes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes`);
      const data = await res.json();
      setDishes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dishes/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : ['All']);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDishes();
    loadCategories();
  }, []);

  // auto refresh when tab focus returns (after admin added dish)
  useEffect(() => {
    const refresh = () => {
      loadDishes();
      loadCategories();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  /////////////////////////////////////
  // FILTER DISHES
  /////////////////////////////////////
  const filteredDishes = useMemo(() => {
    if (activeCategory === 'All') return dishes;
    return dishes.filter((d) => d.category === activeCategory);
  }, [dishes, activeCategory]);

  /////////////////////////////////////
  // CART LOGIC
  /////////////////////////////////////
  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddToCart = (dish) => {
    setCart((prev) => {
      const id = dish.id || dish._id; // backend sends id, but fallback safe
      const existing = prev[id];
      const quantity = existing ? existing.quantity + 1 : 1;

      return {
        ...prev,
        [id]: { ...dish, id, quantity }
      };
    });
  };

  const handleIncrease = handleAddToCart;

  const handleDecrease = (dishId) => {
    setCart((prev) => {
      const existing = prev[dishId];
      if (!existing) return prev;

      const newQty = existing.quantity - 1;

      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }

      return {
        ...prev,
        [dishId]: { ...existing, quantity: newQty }
      };
    });
  };

  /////////////////////////////////////
  // CHECKOUT
  /////////////////////////////////////
  const handleCheckout = async () => {
    const items = Object.values(cart).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    if (!items.length) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const data = await res.json();

      if (!res.ok) return showToast('error', 'Checkout failed', data?.message || 'Try again');

      showToast('success', 'Order placed', `Order ID ${data.orderId}`);

      setCart({});
      setIsCartOpen(false);
    } catch {
      showToast('error', 'Network error', 'Try again');
    }
  };

  /////////////////////////////////////
  // RENDER
  /////////////////////////////////////
  return (
    <div className="app-shell">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setLoginModalOpen(true)}
      />

      {/* FLOATING DOCK */}
      <FloatingDock onLoginClick={() => setLoginModalOpen(true)} />

      {/* LOGIN MODAL */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onFoodie={() => {
          setLoginModalOpen(false);
          // dummy for now
        }}
        onPartner={() => {
          setLoginModalOpen(false);
          window.open('https://khanna-khazana-5.onrender.com', '_blank', 'noopener,noreferrer');
        }}
      />

      <main>
        <Hero />

        <section id="menu" className="section">
          <div className="container">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />

            <DishGrid
              dishes={filteredDishes}
              cartItems={cart}
              onAddToCart={handleAddToCart}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
            />
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cart}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
      />

      <Footer />

      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

//////////////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////////////
export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<MainSite />} />

      <Route
        path="/admin/login"
        element={<AdminLogin onSuccess={() => navigate('/admin/panel')} />}
      />

      <Route path="/admin/panel" element={<AdminPanel />} />
    </Routes>
  );
}