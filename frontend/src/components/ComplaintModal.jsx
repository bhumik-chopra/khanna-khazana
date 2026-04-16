import React, { useState } from "react";

const TYPES = [
  ["hygiene_issue", "Hygiene issue"],
  ["stale_food", "Stale food"],
  ["bad_packaging", "Bad packaging"],
  ["suspicious_food_safety", "Suspicious food safety"]
];

const ComplaintModal = ({ open, restaurant, onClose, onSubmitted, apiBase }) => {
  const [form, setForm] = useState({
    complaintType: TYPES[0][0],
    description: "",
    reporterName: "",
    reporterContact: "",
    orderId: ""
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open || !restaurant) return null;

  const submit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`${apiBase}/api/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          ...form
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to submit complaint");
      setForm({
        complaintType: TYPES[0][0],
        description: "",
        reporterName: "",
        reporterContact: "",
        orderId: ""
      });
      onSubmitted();
      onClose();
    } catch (err) {
      onSubmitted(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kk-auth-modal" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="kk-auth-backdrop" onClick={onClose} />
      <div className="kk-auth-dialog kk-checkout-dialog" role="document">
        <div className="kk-auth-card kk-checkout-card">
          <button type="button" className="kk-auth-close" onClick={onClose}>
            x
          </button>
          <div className="kk-auth-header">
            <div className="kk-auth-badge">Safety report</div>
            <h3 className="kk-auth-heading">Report an issue for {restaurant.name}</h3>
            <p className="kk-auth-copy">Your report helps KK Control review hygiene, packaging, and food safety faster.</p>
          </div>
          <form className="kk-auth-body complaint-form" onSubmit={submit}>
            <label className="complaint-field">
              <span>Issue type</span>
              <select value={form.complaintType} onChange={(e) => setForm((prev) => ({ ...prev, complaintType: e.target.value }))}>
                {TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="complaint-field">
              <span>Order ID</span>
              <input value={form.orderId} onChange={(e) => setForm((prev) => ({ ...prev, orderId: e.target.value }))} />
            </label>
            <label className="complaint-field complaint-field-full">
              <span>Description</span>
              <textarea rows={4} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </label>
            <label className="complaint-field">
              <span>Your name</span>
              <input value={form.reporterName} onChange={(e) => setForm((prev) => ({ ...prev, reporterName: e.target.value }))} />
            </label>
            <label className="complaint-field">
              <span>Contact</span>
              <input value={form.reporterContact} onChange={(e) => setForm((prev) => ({ ...prev, reporterContact: e.target.value }))} />
            </label>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
