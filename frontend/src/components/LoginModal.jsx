import React, { useEffect, useState } from "react";
import {
  SignOutButton,
  SignedIn,
  SignedOut,
  UserButton,
  useSignIn,
  useSignUp
} from "@clerk/clerk-react";
import TargetCursor from "./TargetCursor";

function getClerkErrorMessage(error, fallback) {
  return error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || fallback;
}

function describeIncompleteSignUp(resource) {
  const missingFields = resource?.missingFields?.length
    ? `Missing: ${resource.missingFields.join(", ")}.`
    : "";
  const unverifiedFields = resource?.unverifiedFields?.length
    ? ` Unverified: ${resource.unverifiedFields.join(", ")}.`
    : "";

  return `Sign-up is still incomplete.${missingFields}${unverifiedFields}`;
}

async function finalizeAuth(resource, setActive) {
  if (typeof resource?.finalize === "function") {
    await resource.finalize({
      navigate: () => {}
    });
    return;
  }

  if (resource?.createdSessionId && setActive) {
    await setActive({ session: resource.createdSessionId });
  }
}

export default function LoginModal({ open, onClose, onPartner }) {
  const [mode, setMode] = useState("chooser");
  const [authMode, setAuthMode] = useState("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState("collect");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  useEffect(() => {
    if (open) {
      setMode("chooser");
      setAuthMode("sign-in");
      setEmailAddress("");
      setPassword("");
      setConfirmPassword("");
      setVerificationCode("");
      setStep("collect");
      setBusy(false);
      setErrorMessage("");
      setInfoMessage("");
    }
  }, [open]);

  const startEmailFlow = async () => {
    const email = emailAddress.trim();

    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (authMode === "sign-up" && password !== confirmPassword) {
      setErrorMessage("Password and confirm password must match.");
      return;
    }

    setBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      if (authMode === "sign-up") {
        if (!signUpLoaded || !signUp) {
          throw new Error("Clerk is still loading.");
        }

        await signUp.create({
          emailAddress: email,
          password
        });

        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setStep("verify");
        setInfoMessage(`We sent a verification code to ${email}.`);
      } else {
        if (!signInLoaded || !signIn) {
          throw new Error("Clerk is still loading.");
        }

        const result = await signIn.create({
          identifier: email,
          password
        });

        if (result.status === "complete") {
          await finalizeAuth(result, setActiveSignIn);
          setInfoMessage("Signed in successfully.");
          return;
        }

        throw new Error(`Sign-in returned status "${result.status}".`);
      }
    } catch (error) {
      setErrorMessage(
        getClerkErrorMessage(
          error,
          authMode === "sign-up"
            ? "We couldn't start sign-up."
            : "We couldn't sign you in with email and password."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyEmailCode = async () => {
    const code = verificationCode.trim();

    if (!code) {
      setErrorMessage("Please enter the verification code sent to your email.");
      return;
    }

    setBusy(true);
    setErrorMessage("");

    try {
      if (authMode === "sign-up") {
        if (!signUpLoaded || !signUp) {
          throw new Error("Clerk is still loading.");
        }

        const result = await signUp.attemptEmailAddressVerification({ code });

        if (result.status === "complete") {
          await finalizeAuth(result, setActiveSignUp);
          setInfoMessage("Your foodie account is ready.");
          return;
        }

        if (result.status === "missing_requirements") {
          throw new Error(describeIncompleteSignUp(result));
        }

        throw new Error(`Sign-up verification returned status "${result.status}".`);
      }

      throw new Error("Email code verification is only used for sign-up.");
    } catch (error) {
      setErrorMessage(
        getClerkErrorMessage(
          error,
          "Verification could not be completed. Please use the latest code or request a new one."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const resendVerificationCode = async () => {
    if (!emailAddress.trim()) {
      setErrorMessage("Please enter your email address first.");
      return;
    }

    setBusy(true);
    setErrorMessage("");

    try {
      if (!signUpLoaded || !signUp) {
        throw new Error("Clerk is still loading.");
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setInfoMessage(`A new verification code was sent to ${emailAddress.trim()}. Use the latest one.`);
    } catch (error) {
      setErrorMessage(getClerkErrorMessage(error, "We couldn't resend the verification code."));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <TargetCursor
        targetSelector=".login-modal-target, .kk-auth-custom-button, .kk-auth-tab"
        hideDefaultCursor={true}
        spinDuration={2}
        hoverDuration={0.2}
        parallaxOn={true}
      />

      <div className="kk-auth-backdrop" onClick={onClose} />

      <div className="kk-auth-modal" tabIndex="-1" role="dialog" aria-modal="true">
        <div className={mode === "chooser" ? "kk-auth-dialog" : "kk-auth-dialog kk-auth-dialog-auth"} role="document">
          <div className="kk-auth-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="kk-auth-close login-modal-target"
              aria-label="Close"
              onClick={onClose}
            >
              x
            </button>

            <div className="kk-auth-header">
              <div className="kk-auth-badge">Khanna Khazana</div>
              <h2 className="kk-auth-heading">
                {mode === "chooser" ? "Foodie Login" : "Foodie Account"}
              </h2>
              <p className="kk-auth-copy">
                {mode === "chooser"
                  ? "Choose how you want to continue with Khanna Khazana."
                  : "Use your email address and password for your foodie account."}
              </p>
            </div>

            <div className="kk-auth-body">
              {mode === "chooser" ? (
                <div className="kk-auth-secondary kk-auth-secondary-chooser">
                  <button
                    type="button"
                    className="btn login-modal-target"
                    style={{
                      background: "white",
                      border: "1px solid rgba(0,0,0,0.12)",
                      borderRadius: 14,
                      padding: "0.85rem 1rem",
                      fontWeight: 800,
                      minWidth: 220
                    }}
                    onClick={() => setMode("foodie")}
                  >
                    Login as Foodie
                  </button>

                  <button
                    type="button"
                    className="btn login-modal-target"
                    style={{
                      background: "linear-gradient(90deg, #ff7a1a 0%, #008c4a 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: 14,
                      padding: "0.85rem 1rem",
                      fontWeight: 800,
                      minWidth: 220
                    }}
                    onClick={onPartner}
                  >
                    Login as Partner
                  </button>
                </div>
              ) : (
                <>
                  <div className="kk-auth-topbar">
                    <button
                      type="button"
                      className="kk-auth-back login-modal-target"
                      onClick={() => setMode("chooser")}
                    >
                      Back
                    </button>
                  </div>

                  <SignedOut>
                    <div className="kk-auth-pane kk-auth-pane-custom">
                      <div className="kk-auth-pane-glow" />

                      <div className="kk-auth-tabs">
                        <button
                          type="button"
                          className={`kk-auth-tab ${authMode === "sign-in" ? "is-active" : ""}`}
                          onClick={() => {
                            setAuthMode("sign-in");
                            setStep("collect");
                            setPassword("");
                            setConfirmPassword("");
                            setVerificationCode("");
                            setErrorMessage("");
                            setInfoMessage("");
                          }}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          className={`kk-auth-tab ${authMode === "sign-up" ? "is-active" : ""}`}
                          onClick={() => {
                            setAuthMode("sign-up");
                            setStep("collect");
                            setPassword("");
                            setConfirmPassword("");
                            setVerificationCode("");
                            setErrorMessage("");
                            setInfoMessage("");
                          }}
                        >
                          Sign Up
                        </button>
                      </div>

                      <div className="kk-auth-custom-copy">
                        <h3>
                          {step === "collect"
                            ? authMode === "sign-in"
                              ? "Sign in as foodie"
                              : "Create your foodie account"
                            : "Verify your email"}
                        </h3>
                        <p>
                          {step === "collect"
                            ? authMode === "sign-in"
                              ? "Use your email address and password to access your foodie account."
                              : "Create your foodie account with email and password, then verify your email."
                            : "Enter the latest code we sent to your email address to finish account setup."}
                        </p>
                      </div>

                      {step === "collect" ? (
                        <>
                          <label className="kk-auth-label" htmlFor="foodie-email">
                            Email address
                          </label>
                          <input
                            id="foodie-email"
                            className="kk-auth-input"
                            type="email"
                            placeholder="Enter your email address"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                          />

                          <label className="kk-auth-label" htmlFor="foodie-password">
                            Password
                          </label>
                          <input
                            id="foodie-password"
                            className="kk-auth-input"
                            type="password"
                            placeholder={
                              authMode === "sign-in" ? "Enter your password" : "Create a password"
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />

                          {authMode === "sign-up" ? (
                            <>
                              <label className="kk-auth-label" htmlFor="foodie-confirm-password">
                                Confirm password
                              </label>
                              <input
                                id="foodie-confirm-password"
                                className="kk-auth-input"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                              />
                            </>
                          ) : null}

                          {authMode === "sign-up" ? (
                            <div
                              id="clerk-captcha"
                              data-cl-theme="light"
                              data-cl-size="flexible"
                              style={{ marginTop: "1rem", minHeight: 66 }}
                            />
                          ) : null}
                        </>
                      ) : (
                        <>
                          <label className="kk-auth-label" htmlFor="foodie-code">
                            Verification code
                          </label>
                          <input
                            id="foodie-code"
                            className="kk-auth-input"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter the code from your email"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                        </>
                      )}

                      {errorMessage ? <div className="kk-auth-error">{errorMessage}</div> : null}
                      {infoMessage ? <div className="kk-auth-info">{infoMessage}</div> : null}

                      <button
                        type="button"
                        className={`kk-auth-custom-button login-modal-target ${busy ? "is-loading" : ""}`}
                        onClick={step === "collect" ? startEmailFlow : verifyEmailCode}
                        disabled={busy}
                      >
                        {busy
                          ? "Please wait..."
                          : step === "collect"
                            ? authMode === "sign-in"
                              ? "Sign in as foodie"
                              : "Create foodie account"
                            : "Verify email and continue"}
                      </button>

                      {step === "verify" && authMode === "sign-up" && (
                        <div className="kk-auth-verify-actions">
                          <button
                            type="button"
                            className={`kk-auth-link-button login-modal-target ${busy ? "is-loading" : ""}`}
                            onClick={resendVerificationCode}
                            disabled={busy}
                          >
                            Resend code
                          </button>
                          <button
                            type="button"
                            className="kk-auth-link-button login-modal-target"
                            onClick={() => {
                              setStep("collect");
                              setVerificationCode("");
                              setErrorMessage("");
                            }}
                          >
                            Change email address
                          </button>
                        </div>
                      )}
                    </div>
                  </SignedOut>

                  <SignedIn>
                    <div className="kk-auth-success">
                      <div className="kk-auth-success-icon">OK</div>
                      <h3>You're signed in</h3>
                      <p>Your foodie account is ready. You can continue browsing now.</p>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
