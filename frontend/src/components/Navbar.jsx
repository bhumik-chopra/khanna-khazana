import React from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import logo1 from "./logo1.jpg";

const Navbar = ({ onLoginClick }) => {
  const clerkEnabled = Boolean(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="site-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
      }}
    >
      <div className="container site-header-inner">
        <Link to="/" className="site-brand" aria-label="Go to home">
          <img src={logo1} alt="Khanna Khazana Logo" className="site-brand-logo" />

          <div className="site-brand-copy">
            <div className="site-brand-title">Khanna Khazana</div>
            <div className="site-brand-subtitle">Desi Swad. Smart Delivery.</div>
          </div>
        </Link>

        <div className="site-header-actions">
          <button className="btn btn-ghost-light" onClick={() => scrollTo("how-it-works")}>
            How it works
          </button>

          {clerkEnabled ? (
            <>
              <SignedOut>
                <button className="btn btn-ghost-light" onClick={onLoginClick}>
                  Sign In
                </button>
              </SignedOut>

              <SignedIn>
                <div className="site-user-pill">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </>
          ) : (
            <button className="btn btn-ghost-light" onClick={onLoginClick}>
              Sign In
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
