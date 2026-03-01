import './App.css';
import React, { useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoryFilter from './components/CategoryFilter';
import DishGrid from './components/DishGrid';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { DISHES } from './data';

const API_BASE = 'http://localhost:5000';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ✅ Toast state
  const [toast, setToast] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showToast = (type, title, message) => {
    setToast({ open: true, type, title, message });
  };

  const filteredDishes = useMemo(() => {
    if (activeCategory === 'All') return DISHES;
    return DISHES.filter((d) => d.category === activeCategory);
  }, [activeCategory]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddToCart = (dish) => {
    setCart((prev) => {
      const existing = prev[dish.id];
      const quantity = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [dish.id]: { ...dish, quantity }
      };
    });
  };

  const handleIncrease = (dish) => {
    handleAddToCart(dish);
  };

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

  const handleRemove = (dishId) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[dishId];
      return copy;
    });
  };

  const handleCheckout = async () => {
    const items = Object.values(cart).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    if (items.length === 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast('error', 'Checkout failed', data?.message || 'Please try again.');
        return;
      }

      showToast(
        'success',
        'Order placed!',
        `Order ID: ${data.orderId} • Subtotal: ₹${data.subtotal}`
      );

      setCart({});
      setIsCartOpen(false);
    } catch (err) {
      console.error(err);
      showToast('error', 'Network error', 'Could not place order. Please try again.');
    }
  };

  const handleOrderNow = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <main>
        <Hero onOrderClick={handleOrderNow} />

        <section className="section" id="menu">
          <div className="container">
            <div className="section-header">
              <p className="badge">Our signature menu</p>
              <h2 className="section-title">Pick your Khazana for today</h2>
              <p className="section-subtitle">
                Mix & match across regions — from rich North Indian gravies to
                crisp South Indian dosas and nostalgic street food.
              </p>
            </div>

            <CategoryFilter activeCategory={activeCategory} onChange={setActiveCategory} />

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
        onRemove={handleRemove}
      />

      <Footer />

      {/* ✅ Toast UI */}
      <Toast
        open={toast.open}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
};

export default App;