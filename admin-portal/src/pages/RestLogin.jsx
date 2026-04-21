import React, { useEffect, useState } from "react";
import { SignedIn, useAuth, useSignIn, useSignUp } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import heroWordmark from "./image.png";
import { adminClerkEnabled } from "../clerkConfig";

function toRestaurantUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toRestaurantIdentifier(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (normalized.includes("@")) return normalized.toLowerCase();
  return toRestaurantUsername(normalized);
}

export default function RestLogin() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const [authMode, setAuthMode] = useState("sign-in");
  const [signInForm, setSignInForm] = useState({
    restaurantName: "",
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
  const [authBusy, setAuthBusy] = useState("");
  const [toast, setToast] = useState({
    open: false,
    type: "success",
    title: "",
    message: ""
  });

  const showToast = (type, title, message) => setToast({ open: true, type, title, message });

  useEffect(() => {
    if (isSignedIn) {
      navigate("/panel");
    }
  }, [isSignedIn, navigate]);

  const updateSignUpField = (field, value) => {
    setSignUpForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSignInField = (field, value) => {
    setSignInForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitRestaurantLogin = async (e) => {
    e.preventDefault();
    if (!signInLoaded || authBusy) return;

    try {
      setAuthBusy("sign-in");
      const identifier = toRestaurantIdentifier(signInForm.restaurantName);
      const result = await signIn.create({
        identifier,
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
    } finally {
      setAuthBusy("");
    }
  };

  const submitRestaurantSignUp = async (e) => {
    e.preventDefault();

    if (!signUpLoaded || authBusy) return;

    try {
      setAuthBusy("sign-up");
      await signUp.create({
        username: toRestaurantUsername(signUpForm.restaurantName),
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
    } finally {
      setAuthBusy("");
    }
  };

  const verifyRestaurantSignUp = async (e) => {
    e.preventDefault();
    if (!signUpLoaded || authBusy) return;

    try {
      setAuthBusy("verify");
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
    } finally {
      setAuthBusy("");
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

          {adminClerkEnabled ? (
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
                      <span>Restaurant username or email</span>
                      <input placeholder="Enter username or email" value={signInForm.restaurantName} onChange={(e) => updateSignInField("restaurantName", e.target.value)} />
                    </label>
                    <label className="admin-field">
                      <span>Password</span>
                      <input type="password" value={signInForm.password} onChange={(e) => updateSignInField("password", e.target.value)} />
                    </label>
                    <button className={`btn btn-primary admin-button-full ${authBusy === "sign-in" ? "is-loading" : ""}`} disabled={Boolean(authBusy)}>
                      {authBusy === "sign-in" ? "Logging in..." : "Login to your restaurant panel"}
                    </button>
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
                        <button className={`btn btn-primary admin-button-full ${authBusy === "sign-up" ? "is-loading" : ""}`} disabled={Boolean(authBusy)}>
                          {authBusy === "sign-up" ? "Creating account..." : "Create restaurant account"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={verifyRestaurantSignUp} className="admin-form">
                        <div className="admin-auth-signedin">
                          We sent a verification code to <strong>{signUpForm.emailAddress}</strong>.
                        </div>
                        <div className="admin-auth-signedin">
                          Your sign-in username will be <strong>{toRestaurantUsername(signUpForm.restaurantName)}</strong>.
                        </div>
                        <label className="admin-field">
                          <span>Email verification code</span>
                          <input value={signUpForm.code} onChange={(e) => updateSignUpField("code", e.target.value)} />
                        </label>
                        <button className={`btn btn-primary admin-button-full ${authBusy === "verify" ? "is-loading" : ""}`} disabled={Boolean(authBusy)}>
                          {authBusy === "verify" ? "Verifying..." : "Verify email and continue"}
                        </button>
                        <button type="button" className="btn admin-secondary-button" disabled={Boolean(authBusy)} onClick={() => setSignUpStep("collect")}>
                          Back
                        </button>
                      </form>
                    )}
                  </div>
                )
              ) : null}
            </div>
          ) : null}
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
