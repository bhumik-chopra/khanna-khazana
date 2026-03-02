import React from "react";
import TargetCursor from "./TargetCursor";

export default function LoginModal({ open, onClose, onPartner, onFoodie }) {
  if (!open) return null; // ✅ cleaner: don’t mount anything when closed

  return (
    <>
      {/* ✅ TargetCursor ON */}
      <TargetCursor
        targetSelector=".login-modal-target"
        hideDefaultCursor={true}
        spinDuration={2}
        hoverDuration={0.2}
        parallaxOn={true}
      />

      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 9999 }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div
            className="modal-content"
            style={{ borderRadius: 16, overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()} // ✅ prevent click bubbling to backdrop
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
            >
              <h5 className="modal-title" style={{ fontWeight: 800 }}>
                Login
              </h5>

              {/* ✅ Make close button also targetable */}
              <button
                type="button"
                className="btn-close login-modal-target"
                aria-label="Close"
                onClick={onClose}
              />
            </div>

            <div
              className="modal-body"
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {/* ✅ Fixed type + correct class */}
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
                  padding: "0.75rem 1rem",
                  fontWeight: 800,
                  minWidth: 170
                }}
                onClick={onPartner}
              >
                Login as Partner
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}