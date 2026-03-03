import React from "react";
import { Link } from "react-router-dom";
import logo1 from "./logo1.jpg";

const Navbar = ({ onCartClick, cartCount = 0 }) => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      style={{
        background:
          "linear-gradient(90deg, #ff7a1a 0%, #ff9f1c 50%, #008c4a 100%)",
        color: "var(--white)",
        position: "sticky",
        top: 0,
        zIndex: 20
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem"
        }}
      >
        {/* ✅ Clickable logo + title -> goes to frontend home ("/") */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            textDecoration: "none",
            color: "inherit"
          }}
          aria-label="Go to home"
        >
          <img
            src={logo1}
            alt="Khanna Khazana Logo"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              objectFit: "cover",
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)"
            }}
          />

          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 900, letterSpacing: "0.03em", fontSize: "1.1rem" }}>
              Khanna Khazana
            </div>
            <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
              Desi Swad. Smart Delivery.
            </div>
          </div>
        </Link>

        {/* Right buttons */}
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
          <button
            className="btn"
            style={{
              background: "rgba(255,255,255,0.18)",
              color: "var(--white)",
              paddingInline: "1.0rem",
              border: "1px solid rgba(255,255,255,0.25)"
            }}
            onClick={() => scrollTo("how-it-works")}
          >
            How it works
          </button>

          {/* ✅ Cart button with badge count */}
          <button
            className="btn"
            style={{
              background: "var(--white)",
              color: "#ff7a1a",
              paddingInline: "1.1rem",
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onClick={onCartClick}
          >
            Cart
            {cartCount > 0 && (
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  padding: "0 6px",
                  borderRadius: 999,
                  background: "#ff7a1a",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "grid",
                  placeItems: "center",
                  lineHeight: 1
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;