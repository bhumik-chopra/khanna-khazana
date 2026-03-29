import React from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import logo1 from "./logo1.jpg";

const Navbar = ({ onCartClick, onLoginClick, cartCount = 0 }) => {
  const clerkEnabled = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

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

          {clerkEnabled ? (
            <>
              <SignedOut>
                <button
                  className="btn"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    color: "var(--white)",
                    paddingInline: "1.0rem",
                    border: "1px solid rgba(255,255,255,0.25)"
                  }}
                  onClick={onLoginClick}
                >
                  Sign In
                </button>
              </SignedOut>

              <SignedIn>
                <div
                  style={{
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 999,
                    padding: "0.18rem 0.22rem"
                  }}
                >
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </>
          ) : (
            <button
              className="btn"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "var(--white)",
                paddingInline: "1.0rem",
                border: "1px solid rgba(255,255,255,0.25)"
              }}
              onClick={onLoginClick}
            >
              Sign In
            </button>
          )}

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
