import React from "react";
import { Link } from "react-router-dom";
import heroWordmark from "./image.png";

export default function Entry() {
  return (
    <div className="admin-entry-page">
      <div className="admin-login-bg admin-login-bg-left" />
      <div className="admin-login-bg admin-login-bg-right" />

      <div className="container admin-entry-layout">
        <section className="admin-entry-copy">
          <div className="admin-badge">Khanna Khazana Platform</div>
          <img
            src={heroWordmark}
            alt="Khanna Khazana admin portal"
            className="admin-login-hero-image"
          />
          <h1>Choose how you want to enter the control deck.</h1>
          <p>
            Khanna Khazana is a multi-restaurant platform where restaurants showcase dishes
            for sale through the admin site and customers buy from one shared marketplace.
          </p>

          <div className="admin-login-highlights">
            <div className="admin-highlight-card">
              <strong>Platform admin</strong>
              <span>Oversee the marketplace, restaurants, safety, and shared operations.</span>
            </div>
            <div className="admin-highlight-card">
              <strong>Restaurant access</strong>
              <span>Manage one restaurant profile, upload dishes, and monitor compliance.</span>
            </div>
          </div>
        </section>

        <section className="admin-entry-panel">
          <div className="admin-card-kicker">Select Entry</div>
          <h2>Enter with the right role</h2>
          <p>Choose the path that matches how you want to use the admin website today.</p>

          <div className="admin-entry-actions">
            <Link to="/login?role=admin" className="admin-entry-card admin-entry-card-admin">
              <span className="admin-entry-kicker">Platform control</span>
              <strong>Login as admin</strong>
              <p>Use the central admin account to manage the full Khanna Khazana platform.</p>
            </Link>

            <Link
              to="/login?role=restaurant"
              className="admin-entry-card admin-entry-card-restaurant"
            >
              <span className="admin-entry-kicker">Restaurant control</span>
              <strong>Login as restaurant</strong>
              <p>Sign in or sign up as a restaurant and upload dishes into the shared app.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
