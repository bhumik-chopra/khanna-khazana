import logo from './logo.svg';
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
import { DISHES } from './data';

const App = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

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
        [dish.id]: {
          ...dish,
          quantity
        }
      };
    });
  };

  const handleOrderNow = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main>
        <Hero onOrderClick={handleOrderNow} />

        {/* Menu Section */}
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

            <CategoryFilter
              activeCategory={activeCategory}
              onChange={setActiveCategory}
            />

            <DishGrid dishes={filteredDishes} onAddToCart={handleAddToCart} />
          </div>
        </section>

        <HowItWorks />
        <Testimonials />
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cart}
        onClose={() => setIsCartOpen(false)}
      />

      <Footer />
    </div>
  );
};

export default App;
