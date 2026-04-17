import React from "react";
import { Link } from "react-router-dom";
import TargetCursor from "../components/TargetCursor";

export default function Entry() {
  return (
    <div className="admin-entry-page">
      <TargetCursor
        targetSelector=".admin-entry-target"
        hideDefaultCursor={true}
        spinDuration={2}
        hoverDuration={0.2}
        parallaxOn={true}
      />

      <div className="admin-login-bg admin-login-bg-left" />
      <div className="admin-login-bg admin-login-bg-right" />

      <main className="container admin-entry-minimal">
        <header className="admin-entry-header">
          <div className="admin-badge">Khanna Khazana</div>
          <h1>Choose your path</h1>
        </header>

        <Link
          to="/admin-login"
          className="admin-entry-box admin-entry-box-admin admin-entry-target"
        >
          <div className="admin-entry-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="presentation">
              <path d="M32 10l18 8v12c0 12-7.5 22.8-18 26-10.5-3.2-18-14-18-26V18l18-8z" />
              <path d="M25 31l5 5 10-11" />
            </svg>
          </div>
          <span>login as</span>
          <strong>admin</strong>
        </Link>

        <Link
          to="/login?role=restaurant"
          className="admin-entry-box admin-entry-box-restaurant admin-entry-target"
        >
          <div className="admin-entry-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" role="presentation">
              <path d="M14 28h36v20a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V28z" />
              <path d="M18 28V18a14 14 0 0 1 28 0v10" />
              <path d="M24 38h16" />
            </svg>
          </div>
          <span>login as</span>
          <strong>restaurant</strong>
        </Link>
      </main>
    </div>
  );
}
