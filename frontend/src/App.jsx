import "./App.css";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
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
import SafetyFilterBar from "./components/SafetyFilterBar";
import RestaurantGrid from "./components/RestaurantGrid";
import ComplaintModal from "./components/ComplaintModal";
import RestaurantDetailPage from "./components/RestaurantDetailPage";

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
  const lastScrollRef = useRef(0);
  const upwardRevealDistanceRef = useRef(0);
  const rafRef = useRef(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    lastScrollRef.current = window.scrollY;
    upwardRevealDistanceRef.current = 0;

    const handleScroll = () => {
      if (rafRef.current !== null) return;

      rafRef.current = window.requestAnimationFrame(() => {
        const current = window.scrollY;
        const last = lastScrollRef.current;
        const delta = current - last;
        const scrollTolerance = 6;

        if (current < 120) {
          setVisible(true);
          upwardRevealDistanceRef.current = 0;
        } else if (delta > scrollTolerance) {
          if (visibleRef.current) {
            setVisible(false);
          }
          upwardRevealDistanceRef.current = 0;
        } else if (delta < -scrollTolerance) {
          upwardRevealDistanceRef.current += Math.abs(delta);

          if (upwardRevealDistanceRef.current > 220) {
            setVisible(true);
            upwardRevealDistanceRef.current = 0;
          }
        } else {
          upwardRevealDistanceRef.current = Math.max(0, upwardRevealDistanceRef.current - 2);
        }

        lastScrollRef.current = current;
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const items = [
    {
      label: "Home",
      icon: (
        <span className="dock-chip dock-chip-home">
          <span className="dock-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 10.5 12 4l8 6.5" />
              <path d="M6.5 9.5V20h11V9.5" />
            </svg>
          </span>
          <span className="dock-chip-label">Home</span>
        </span>
      ),
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" })
    },
    {
      label: "Menu",
      icon: (
        <span className="dock-chip dock-chip-menu">
          <span className="dock-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 7h14" />
              <path d="M5 12h14" />
              <path d="M5 17h10" />
            </svg>
          </span>
          <span className="dock-chip-label">Menu</span>
        </span>
      ),
      onClick: () => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })
    },
    {
      label: "Cart",
      className: "dock-item-cart",
      icon: (
        <span className="dock-chip dock-chip-cart">
          <span className="dock-chip-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 7h13l-1.5 7.5H9L7 7Z" />
              <path d="M7 7 6.2 4.8A1.5 1.5 0 0 0 4.8 4H3.5" />
              <circle cx="10" cy="18.2" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17.3" cy="18.2" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="dock-chip-copy">
            <span className="dock-chip-label">Cart</span>
            <span className="dock-chip-subtitle">{cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "Ready"}</span>
          </span>
          {cartCount > 0 ? <span className="dock-chip-badge">{cartCount}</span> : null}
        </span>
      ),
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

function MainSite({ clerkEnabled, isSignedIn }) {
  useFoodBackgroundMotion();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [safetyFilters, setSafetyFilters] = useState({
    verifiedOnly: false,
    scoreAbove80: false,
    safePackaging: false
  });
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutChooserOpen, setCheckoutChooserOpen] = useState(false);
  const [upiInfoOpen, setUpiInfoOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [complaintRestaurant, setComplaintRestaurant] = useState(null);
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

  const loadRestaurants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/restaurants`);
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setIsCatalogLoading(true);
    Promise.all([loadDishes(), loadCategories(), loadRestaurants()])
      .finally(() => setIsCatalogLoading(false));
  }, []);

  useEffect(() => {
    const refresh = () => {
      loadDishes();
      loadCategories();
      loadRestaurants();
    };

    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const filteredRestaurants = useMemo(
    () =>
      restaurants.filter((restaurant) => {
        if (safetyFilters.verifiedOnly && !restaurant.badges?.verifiedKitchen) return false;
        if (safetyFilters.scoreAbove80 && Number(restaurant.headingSafety?.score ?? restaurant.hygieneScore ?? 0) < 80) return false;
        if (safetyFilters.safePackaging && !restaurant.badges?.safePackaging) return false;
        return true;
      }),
    [restaurants, safetyFilters]
  );

  const filteredDishes = useMemo(() => {
    const allowedIds = new Set(filteredRestaurants.map((restaurant) => restaurant.id));
    const scoped = dishes.filter((dish) => {
      if (allowedIds.size === 0 && restaurants.length > 0) return false;
      if (allowedIds.size > 0) return allowedIds.has(dish.restaurantId || dish.restaurant?.id);
      return true;
    });

    if (activeCategory === "All") return scoped;
    return scoped.filter((dish) => dish.category === activeCategory);
  }, [activeCategory, dishes, filteredRestaurants, restaurants.length]);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const trustedKitchenMessage = useMemo(() => {
    if (!cartItems.length) return "";
    const restaurantIds = [
      ...new Set(cartItems.map((item) => item.restaurantId || item.restaurant?.id).filter(Boolean))
    ];
    if (restaurantIds.length !== 1) return "";
    const restaurant = restaurants.find((item) => item.id === restaurantIds[0]);
    if (!restaurant?.badges?.verifiedKitchen) return "";
    return `This order is from a verified kitchen: ${restaurant.name}`;
  }, [cartItems, restaurants]);

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
    if (!isSignedIn) {
      setCheckoutChooserOpen(false);
      setUpiInfoOpen(false);
      setIsCartOpen(false);
      setLoginModalOpen(true);
      showToast("error", "Sign in required", "Please sign in to your account before payment.");
      return;
    }

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
          itemsCount: String(items.length)
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

  const openCheckoutChooser = () => {
    if (cartCount === 0 || isCheckingOut) return;

    if (!isSignedIn) {
      setIsCartOpen(false);

      if (clerkEnabled) {
        setLoginModalOpen(true);
        showToast("error", "Sign in required", "Please sign in to your account before payment.");
      } else {
        showToast("error", "Sign in unavailable", "Customer sign-in must be configured before payment can continue.");
      }

      return;
    }

    setIsCartOpen(false);
    setCheckoutChooserOpen(true);
  };

  const handleCheckoutFromChooser = async () => {
    setCheckoutChooserOpen(false);
    await handleCheckout();
  };

  const handleOpenUpiGuide = () => {
    setCheckoutChooserOpen(false);
    setUpiInfoOpen(true);
  };

  const handleTryUpiCheckout = async () => {
    setUpiInfoOpen(false);
    await handleCheckout();
  };

  const handleSafetyFilterChange = (key, value) => {
    setSafetyFilters((prev) => ({ ...prev, [key]: value }));
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
              <p className="badge badge-glass">Trusted kitchens</p>
              <h2 className="section-title">Browse restaurants with visible safety status</h2>
              <p className="section-subtitle">
                Filter kitchens by approved safety headings, heading score, and packaging approval before you order.
              </p>
            </div>

            <SafetyFilterBar filters={safetyFilters} onChange={handleSafetyFilterChange} />

            {isCatalogLoading ? (
              <div className="kk-loading-state">Loading trusted kitchens...</div>
            ) : (
              <RestaurantGrid
                restaurants={filteredRestaurants}
                onReport={(restaurant) => setComplaintRestaurant(restaurant)}
              />
            )}

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

            {isCatalogLoading ? (
              <div className="kk-loading-state">Loading fresh plates...</div>
            ) : (
              <DishGrid
                dishes={filteredDishes}
                cartItems={cart}
                onAddToCart={handleAddToCart}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
              />
            )}
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
        trustedKitchenMessage={trustedKitchenMessage}
        onClose={() => setIsCartOpen(false)}
        onCheckout={openCheckoutChooser}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onRemove={handleRemove}
      />

      {checkoutChooserOpen ? (
        <div className="kk-auth-modal" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="kk-auth-backdrop" onClick={() => setCheckoutChooserOpen(false)} />
          <div
            className="kk-auth-dialog kk-checkout-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kk-auth-card kk-checkout-card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="kk-auth-close" onClick={() => setCheckoutChooserOpen(false)}>
                x
              </button>
              <div className="kk-auth-header">
                <div className="kk-auth-badge">Checkout paths</div>
                <h3 className="kk-auth-heading">Choose how you want to pay</h3>
                <p className="kk-auth-copy">
                  Complete the same order flow through Razorpay, or open a quick UPI scan guide first.
                </p>
              </div>
              <div className="kk-auth-body">
                <div className="kk-checkout-grid">
                  <button
                    type="button"
                    className="kk-checkout-option kk-checkout-option-primary"
                    onClick={handleCheckoutFromChooser}
                    disabled={isCheckingOut}
                  >
                    <span className="kk-checkout-option-tag">Recommended</span>
                    <strong>Pay with Razorpay</strong>
                    <span>
                      Open the full checkout with cards, UPI, netbanking, and any other supported payment methods.
                    </span>
                  </button>
                  <button type="button" className="kk-checkout-option" onClick={handleOpenUpiGuide} disabled={isCheckingOut}>
                    <span className="kk-checkout-option-tag">UPI helper</span>
                    <strong>Show UPI QR / scan instructions</strong>
                    <span>
                      See the fastest way to pay by UPI on desktop or mobile, then continue into checkout.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {upiInfoOpen ? (
        <div className="kk-auth-modal" tabIndex="-1" role="dialog" aria-modal="true">
          <div className="kk-auth-backdrop" onClick={() => setUpiInfoOpen(false)} />
          <div
            className="kk-auth-dialog kk-checkout-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kk-auth-card kk-checkout-card" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="kk-auth-close" onClick={() => setUpiInfoOpen(false)}>
                x
              </button>
              <div className="kk-auth-header">
                <div className="kk-auth-badge">UPI guide</div>
                <h3 className="kk-auth-heading">Use UPI with the best path for your device</h3>
                <p className="kk-auth-copy">
                  Razorpay controls whether a QR code or app-open option appears, so this guide keeps the flow clear before you continue.
                </p>
              </div>
              <div className="kk-auth-body">
                <div className="kk-upi-steps">
                  <div className="kk-upi-step">
                    <strong>On desktop</strong>
                    <span>Open checkout and look for a UPI or scan-and-pay option. Razorpay may show a QR code when that method is available for the session.</span>
                  </div>
                  <div className="kk-upi-step">
                    <strong>On mobile</strong>
                    <span>Open checkout and select UPI. Razorpay often hands off directly to supported apps like Google Pay, PhonePe, or Paytm.</span>
                  </div>
                  <div className="kk-upi-step">
                    <strong>After payment</strong>
                    <span>Your order is only placed after payment success and backend verification, so MongoDB still gets the final confirmed order.</span>
                  </div>
                </div>
                <div className="kk-upi-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setUpiInfoOpen(false)}>
                    Back
                  </button>
                  <button type="button" className={`btn btn-primary ${isCheckingOut ? "is-loading" : ""}`} disabled={isCheckingOut} onClick={handleTryUpiCheckout}>
                    {isCheckingOut ? "Opening checkout..." : "Continue to Razorpay"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />

      <ComplaintModal
        open={Boolean(complaintRestaurant)}
        restaurant={complaintRestaurant}
        apiBase={API_BASE}
        onClose={() => setComplaintRestaurant(null)}
        onSubmitted={(message, isError = false) =>
          showToast(
            isError ? "error" : "success",
            isError ? "Complaint failed" : "Complaint submitted",
            message || "KK Control will review this report."
          )
        }
      />

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
  const clerkEnabled = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

  if (clerkEnabled) {
    return <AuthenticatedAppRoutes clerkEnabled={clerkEnabled} />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainSite clerkEnabled={false} isSignedIn={false} />} />
      <Route path="/restaurants/:id" element={<RestaurantDetailPage apiBase={API_BASE} />} />
    </Routes>
  );
}

function AuthenticatedAppRoutes({ clerkEnabled }) {
  const { isSignedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<MainSite clerkEnabled={clerkEnabled} isSignedIn={Boolean(isSignedIn)} />} />
      <Route path="/restaurants/:id" element={<RestaurantDetailPage apiBase={API_BASE} />} />
    </Routes>
  );
}
