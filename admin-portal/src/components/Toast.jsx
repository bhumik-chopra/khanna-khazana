import React, { useEffect } from "react";

const Toast = ({ open, type = "success", title, message, onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, duration, onClose]);

  if (!open) return null;

  const isSuccess = type === "success";

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        top: 18,
        zIndex: 9999,
        width: "min(420px, calc(100vw - 36px))"
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          borderRadius: 16,
          padding: "12px 14px",
          background: "var(--white)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
          border: `1px solid ${isSuccess ? "rgba(0,140,74,0.18)" : "rgba(255,0,0,0.16)"}`,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: 4,
            background: isSuccess
              ? "linear-gradient(90deg, #008c4a, #ff7a1a)"
              : "linear-gradient(90deg, #ff3b30, #ff9f1c)",
            margin: "-12px -14px 10px"
          }}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: isSuccess ? "rgba(0,140,74,0.10)" : "rgba(255,59,48,0.10)",
              color: isSuccess ? "#008c4a" : "#ff3b30",
              fontWeight: 900
            }}
          >
            {isSuccess ? "✓" : "!"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: "0.86rem", color: "var(--text-muted)" }}>
              {message}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "rgba(0,0,0,0.06)",
              width: 30,
              height: 30,
              borderRadius: 10,
              cursor: "pointer"
            }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;