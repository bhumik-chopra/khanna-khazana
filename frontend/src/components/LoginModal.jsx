import React from "react";
import { SignIn, SignedIn, SignedOut, SignOutButton, UserButton } from "@clerk/clerk-react";
import TargetCursor from "./TargetCursor";

export default function LoginModal({ open, onClose, onPartner, onFoodie }) {
  const clerkEnabled = Boolean(
    process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || process.env.REACT_APP_CLERKPUBLICKEY
  );

  const clerkAppearance = {
    variables: {
      colorPrimary: "#ff7a1a",
      colorText: "#1f1f1f",
      colorTextSecondary: "#6d6d6d",
      colorBackground: "transparent",
      colorInputBackground: "#ffffff",
      colorInputText: "#1f1f1f",
      colorInputPlaceholder: "#8b8b8b",
      colorNeutral: "#f7efe7",
      borderRadius: "16px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    elements: {
      rootBox: "kk-clerk-root",
      cardBox: "kk-clerk-card-box",
      card: "kk-clerk-card",
      headerTitle: "kk-clerk-title",
      headerSubtitle: "kk-clerk-subtitle",
      socialButtonsBlockButton: "kk-clerk-social-button",
      socialButtonsBlockButtonText: "kk-clerk-social-button-text",
      dividerRow: "kk-clerk-divider-row",
      dividerLine: "kk-clerk-divider-line",
      dividerText: "kk-clerk-divider-text",
      formFieldLabel: "kk-clerk-field-label",
      formFieldInput: "kk-clerk-field-input",
      formButtonPrimary: "kk-clerk-primary-button",
      footerActionText: "kk-clerk-footer-text",
      footerActionLink: "kk-clerk-footer-link",
      formFieldAction: "kk-clerk-footer-link",
      formResendCodeLink: "kk-clerk-footer-link",
      otpCodeFieldInput: "kk-clerk-otp-input",
      alert: "kk-clerk-alert"
    }
  };

  if (!open) return null;

  return (
    <>
      <TargetCursor
        targetSelector=".login-modal-target, .kk-clerk-social-button, .kk-clerk-primary-button"
        hideDefaultCursor={true}
        spinDuration={2}
        hoverDuration={0.2}
        parallaxOn={true}
      />

      <div className="kk-auth-backdrop" onClick={onClose} />

      <div className="kk-auth-modal" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="kk-auth-dialog" role="document">
          <div className="kk-auth-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="kk-auth-close login-modal-target"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>

            <div className="kk-auth-header">
              <div className="kk-auth-badge">Khanna Khazana</div>
              <h2 className="kk-auth-heading">Sign in or create your account</h2>
              <p className="kk-auth-copy">
                Continue with Clerk in a way that matches your food-first Khanna Khazana
                experience.
              </p>
            </div>

            <div className="kk-auth-body">
              {!clerkEnabled ? (
                <div className="kk-auth-config">
                  Add `REACT_APP_CLERK_PUBLISHABLE_KEY` in `frontend/.env.local` to enable Clerk
                  authentication in this modal.
                </div>
              ) : (
                <>
                  <SignedOut>
                    <SignIn
                      routing="virtual"
                      withSignUp={true}
                      fallbackRedirectUrl="/"
                      appearance={clerkAppearance}
                    />
                  </SignedOut>

                  <SignedIn>
                    <div className="kk-auth-success">
                      <div className="kk-auth-success-icon">✓</div>
                      <h3>You're signed in</h3>
                      <p>Your account is ready. You can continue browsing or manage your profile.</p>
                      <div className="kk-auth-success-actions">
                        <button
                          type="button"
                          className="btn btn-primary login-modal-target"
                          onClick={onClose}
                          style={{ justifyContent: "center" }}
                        >
                          Continue shopping
                        </button>
                        <div className="kk-auth-user-row">
                          <UserButton afterSignOutUrl="/" />
                          <SignOutButton redirectUrl="/">
                            <button
                              type="button"
                              className="btn login-modal-target"
                              style={{
                                background: "white",
                                border: "1px solid rgba(0,0,0,0.12)",
                                borderRadius: 14,
                                fontWeight: 800
                              }}
                            >
                              Sign out
                            </button>
                          </SignOutButton>
                        </div>
                      </div>
                    </div>
                  </SignedIn>
                </>
              )}

              <div className="kk-auth-secondary">
                <button
                  type="button"
                  className="btn login-modal-target"
                  style={{
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 14,
                    padding: "0.75rem 1rem",
                    fontWeight: 800,
                    minWidth: 170
                  }}
                  onClick={onFoodie}
                >
                  Continue as Foodie
                </button>

                <button
                  type="button"
                  className="btn login-modal-target"
                  style={{
                    background: "linear-gradient(90deg, #ff7a1a 0%, #008c4a 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 14,
                    padding: "0.75rem 1rem",
                    fontWeight: 800,
                    minWidth: 170
                  }}
                  onClick={onPartner}
                >
                  Continue as Partner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
