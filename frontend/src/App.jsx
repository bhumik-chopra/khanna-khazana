import "./App.css";
import React, { useMemo, useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CategoryFilter from "./components/CategoryFilter";
import DishGrid from "./components/DishGrid";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import Dock from "./components/Dock";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise = null;

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

function useFoodBackgroundMotion() {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let offset = 0;
    let frame = null;

    const syncBackgroundMotion = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      offset += delta * 0.18;
      offset = Math.max(-180, Math.min(180, offset));

      document.body.style.setProperty("--food-scroll-y", `${offset.toFixed(1)}px`);
      lastScrollY = currentScrollY;
      frame = null;
    };

    const handleScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncBackgroundMotion);
    };

    document.body.style.setProperty("--food-scroll-y", "0px");
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", handleScroll);
      document.body.style.setProperty("--food-scroll-y", "0px");
    };
  }, []);
}

function FloatingDock({ onCartClick, cartCount }) {
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  const items = [
    {
      label: "Home",
      icon: <span>Home</span>,
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" })
    },
    {
      label: "Menu",
      icon: <span>Menu</span>,
      onClick: () => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
    },
    {
      label: "Cart",
      icon: <span>{cartCount > 0 ? `Cart ${cartCount}` : "Cart"}</span>,
      onClick: onCartClick
    }
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "96px",
        left: "50%",
        transform: visible ? "translate(-50%, 0px)" : "translate(-50%, -120px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.45s cubic-bezier(.22,.61,.36,1), opacity 0.35s ease",
        zIndex: 15,
        pointerEvents: "none"
      }}
    >
      <div style={{ pointerEvents: "auto" }}>
        <Dock items={items} magnification={60} baseItemSize={40} distance={140} panelHeight={64} />
      </div>
    </div>
  );
}

function MainSite() {
  useFoodBackgroundMotion();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", title: "", message: "" });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

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
      setCategories(Array.isArray(data) ? data : ["All"]);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDishes();
    loadCategories();
  }, []);

  useEffect(() => {
    const refresh = () => {
      loadDishes();
      loadCategories();
    };

    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const filteredDishes = useMemo(() => {
    if (activeCategory === "All") return dishes;
    return dishes.filter((d) => d.category === activeCategory);
  }, [dishes, activeCategory]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleAddToCart = (dish) => {
    setCart((prev) => {
      const id = dish.id || dish._id;
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

    if (!items.length) return;

    try {
      setIsCheckingOut(true);

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const res = await fetch(`${API_BASE}/api/orders/create-payment-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });

      const data = await res.json();

      if (!res.ok) {
        setIsCheckingOut(false);
        return showToast("error", "Checkout failed", data?.message || "Try again");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Khanna Khazana",
        description: "Fresh food checkout",
        order_id: data.paymentOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/orders/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items,
                ...response
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData?.message || "Payment verification failed");
            }

            showToast("success", "Order placed", `Order ID ${verifyData.orderId}`);
            setCart({});
            setIsCartOpen(false);
          } catch (err) {
            showToast("error", "Payment captured but order failed", err.message || "Try again");
          } finally {
            setIsCheckingOut(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsCheckingOut(false);
            showToast("error", "Payment cancelled", "Your order was not placed.");
          }
        },
        prefill: {
          name: "Khanna Khazana Customer"
        },
        notes: {
          itemsCount: String(items.length),
          paymentMode: "upi"
        },
        theme: {
          color: "#ff7a1a"
        }
      };

      const razorpayCheckout = new window.Razorpay(options);
      razorpayCheckout.on("payment.failed", (response) => {
        setIsCheckingOut(false);
        showToast(
          "error",
          "Payment failed",
          response?.error?.description || "Your payment could not be completed."
        );
      });
      razorpayCheckout.open();
    } catch (err) {
      setIsCheckingOut(false);
      showToast("error", "Checkout failed", err.message || "Try again");
    }
  };

  return (
    <div className="app-shell">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        onLoginClick={() => setLoginModalOpen(true)}
      />

      <FloatingDock onCartClick={() => setIsCartOpen(true)} cartCount={cartCount} />

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onPartner={() => {
          setLoginModalOpen(false);
          window.open("https://khanna-khazana-5.onrender.com", "_blank", "noopener,noreferrer");
        }}
      />

      <main className="site-main">
        <Hero
          onOrderClick={() => {
            const el = document.getElementById("menu");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <section id="menu" className="section menu-section">
          <div className="container">
            <div className="section-header section-header-left">
              <p className="badge badge-glass">Live menu radar</p>
              <h2 className="section-title">Fresh plates tuned to every craving</h2>
              <p className="section-subtitle">
                Hover through chef drops, regional comfort bowls, and street-food favourites
                built to feel vivid, fast, and irresistible.
              </p>
            </div>

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
        subtotal={cartSubtotal}
        itemCount={cartCount}
        isCheckingOut={isCheckingOut}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onRemove={handleRemove}
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainSite />} />
    </Routes>
  );
}
