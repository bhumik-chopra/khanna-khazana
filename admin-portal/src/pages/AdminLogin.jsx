import React, { useEffect, useState } from "react";
import { SignedIn, useAuth, useSignIn, useSignUp } from "@clerk/clerk-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Toast from "../components/Toast";
import heroWordmark from "./image.png";
import { adminClerkEnabled } from "../clerkConfig";

const API_BASE = process.env.REACT_APP_API_BASE || "https://khanna-khazana-3.onrender.com";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const roleMode = searchParams.get("role");
  const [authMode, setAuthMode] = useState(roleMode === "restaurant" ? "sign-in" : "sign-in");
  const [signInForm, setSignInForm] = useState({
    restaurantName: "",
    emailAddress: "",
    password: ""
  });
  const [signUpStep, setSignUpStep] = useState("collect");
  const [signUpForm, setSignUpForm] = useState({
    restaurantName: "",
    ownerName: "",
    gstnNumber: "",
    emailAddress: "",
    password: "",
    code: ""
  });
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  useEffect(() => {
    if (isSignedIn || localStorage.getItem("admin_token")) {
      navigate("/panel");
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (roleMode === "restaurant") {
      setAuthMode("sign-in");
    }
  }, [roleMode]);

  const updateSignUpField = (field, value) => {
    setSignUpForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSignInField = (field, value) => {
    setSignInForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitRestaurantLogin = async (e) => {
    e.preventDefault();
    if (!signInLoaded) return;

    try {
      const result = await signIn.create({
        identifier: signInForm.emailAddress,
        password: signInForm.password
      });

      if (result.status !== "complete") {
        showToast("error", "Login failed", "Could not complete restaurant login.");
        return;
      }

      await setActiveSignIn({ session: result.createdSessionId });
      showToast("success", "Logged in", "Welcome back to your restaurant control panel.");
      navigate("/panel");
    } catch (err) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || "Login failed";
      showToast("error", "Login failed", message);
    }
  };

  const submitRestaurantSignUp = async (e) => {
    e.preventDefault();

    if (!signUpLoaded) return;

    try {
      await signUp.create({
        emailAddress: signUpForm.emailAddress,
        password: signUpForm.password,
        unsafeMetadata: {
          restaurantName: signUpForm.restaurantName,
          ownerName: signUpForm.ownerName,
          gstnNumber: signUpForm.gstnNumber,
          role: "restaurant_owner"
        }
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setSignUpStep("verify");
      showToast("success", "Verification sent", "Check your email for the verification code.");
    } catch (err) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || "Sign up failed";
      showToast("error", "Sign up failed", message);
    }
  };

  const verifyRestaurantSignUp = async (e) => {
    e.preventDefault();
    if (!signUpLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: signUpForm.code
      });

      if (result.status !== "complete") {
        showToast("error", "Verification incomplete", "Please enter the correct email code.");
        return;
      }

      await setActive({ session: result.createdSessionId });
      showToast("success", "Email verified", "Restaurant account created successfully.");
      navigate("/panel");
    } catch (err) {
      const message = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err.message || "Verification failed";
      showToast("error", "Verification failed", message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        showToast("error", "Login failed", data?.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("admin_token", data.token);
      showToast("success", "Logged in", "Welcome back to the control deck.");
      setTimeout(() => navigate("/panel"), 250);
    } catch (err) {
      console.error(err);
      showToast("error", "Network error", "Backend not reachable");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-bg admin-login-bg-left" />
      <div className="admin-login-bg admin-login-bg-right" />

      <div className="container admin-login-layout">
        <section className="admin-login-copy">
          <div className="admin-badge">Khanna Khazana Control Deck</div>
          <Link to="/" className="admin-entry-back">
            Back to entry
          </Link>
          <img
            src={heroWordmark}
            alt="Khanna Khazana admin portal"
            className="admin-login-hero-image"
          />
          <p>
            A premium admin experience for managing dishes, categories, and storefront
            operations with a bold food-tech visual system.
          </p>

          <div className="admin-login-highlights">
            <div className="admin-highlight-card">
              <strong>Live menu editing</strong>
              <span>Add new dishes and refresh the storefront instantly.</span>
            </div>
            <div className="admin-highlight-card">
              <strong>Food-first visuals</strong>
              <span>Warm gradients, glass panels, and food-inspired backgrounds.</span>
            </div>
          </div>
        </section>

        <section className="admin-login-card">
          <div className="admin-card-kicker">Restaurant Access</div>
          <h2>Sign in to the panel</h2>
          <p>Restaurants can create an account here and manage their own dishes inside the shared Khanna Khazana marketplace.</p>

          {adminClerkEnabled && roleMode !== "admin" ? (
            <div className="admin-auth-stack">
              <div className="admin-auth-toggle">
                <button type="button" className={`admin-auth-chip ${authMode === "sign-in" ? "is-active" : ""}`} onClick={() => setAuthMode("sign-in")}>
                  Restaurant login
                </button>
                <button type="button" className={`admin-auth-chip ${authMode === "sign-up" ? "is-active" : ""}`} onClick={() => setAuthMode("sign-up")}>
                  Restaurant sign up
                </button>
              </div>

              <SignedIn>
                <div className="admin-auth-signedin">Signed in successfully. Redirecting to the control panel...</div>
              </SignedIn>

              {!isSignedIn ? (
                authMode === "sign-in" ? (
                  <form onSubmit={submitRestaurantLogin} className="admin-form">
                    <label className="admin-field">
                      <span>Restaurant name</span>
                      <input value={signInForm.restaurantName} onChange={(e) => updateSignInField("restaurantName", e.target.value)} />
                    </label>
                    <label className="admin-field">
                      <span>Email</span>
                      <input type="email" value={signInForm.emailAddress} onChange={(e) => updateSignInField("emailAddress", e.target.value)} />
                    </label>
                    <label className="admin-field">
                      <span>Password</span>
                      <input type="password" value={signInForm.password} onChange={(e) => updateSignInField("password", e.target.value)} />
                    </label>
                    <button className="btn btn-primary admin-button-full">Login to your restaurant panel</button>
                  </form>
                ) : (
                  <div className="admin-signup-shell">
                    {signUpStep === "collect" ? (
                      <form onSubmit={submitRestaurantSignUp} className="admin-form">
                        <label className="admin-field">
                          <span>Restaurant name</span>
                          <input value={signUpForm.restaurantName} onChange={(e) => updateSignUpField("restaurantName", e.target.value)} />
                        </label>
                        <label className="admin-field">
                          <span>Owner name</span>
                          <input value={signUpForm.ownerName} onChange={(e) => updateSignUpField("ownerName", e.target.value)} />
                        </label>
                        <label className="admin-field">
                          <span>GSTN number</span>
                          <input value={signUpForm.gstnNumber} onChange={(e) => updateSignUpField("gstnNumber", e.target.value)} />
                        </label>
                        <label className="admin-field">
                          <span>Email</span>
                          <input type="email" value={signUpForm.emailAddress} onChange={(e) => updateSignUpField("emailAddress", e.target.value)} />
                        </label>
                        <label className="admin-field">
                          <span>Password</span>
                          <input type="password" value={signUpForm.password} onChange={(e) => updateSignUpField("password", e.target.value)} />
                        </label>
                        <button className="btn btn-primary admin-button-full">Create restaurant account</button>
                      </form>
                    ) : (
                      <form onSubmit={verifyRestaurantSignUp} className="admin-form">
                        <div className="admin-auth-signedin">
                          We sent a verification code to <strong>{signUpForm.emailAddress}</strong>.
                        </div>
                        <label className="admin-field">
                          <span>Email verification code</span>
                          <input value={signUpForm.code} onChange={(e) => updateSignUpField("code", e.target.value)} />
                        </label>
                        <button className="btn btn-primary admin-button-full">Verify email and continue</button>
                        <button type="button" className="btn admin-secondary-button" onClick={() => setSignUpStep("collect")}>
                          Back
                        </button>
                      </form>
                    )}
                  </div>
                )
              ) : null}
            </div>
          ) : null}

          <div className="admin-auth-divider">Platform admin login</div>

          <form onSubmit={submit} className="admin-form">
            <label className="admin-field">
              <span>Username</span>
              <input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>

            <label className="admin-field">
              <span>Password</span>
              <input placeholder="Enter password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            <button className="btn btn-primary admin-button-full">Enter control deck</button>

            <button type="button" className="btn admin-secondary-button" onClick={() => window.open("https://khanna-khazana-4.onrender.com", "_blank", "noopener,noreferrer")}>
              Open delivery portal
            </button>
          </form>
        </section>
      </div>

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
