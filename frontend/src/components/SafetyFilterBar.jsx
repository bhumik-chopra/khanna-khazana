import React from "react";

const SafetyFilterBar = ({ filters, onChange }) => (
  <div className="safety-filter-bar">
    <label className="safety-filter-pill">
      <input
        type="checkbox"
        checked={filters.verifiedOnly}
        onChange={(e) => onChange("verifiedOnly", e.target.checked)}
      />
      <span>Verified Kitchens only</span>
    </label>

    <label className="safety-filter-pill">
      <input
        type="checkbox"
        checked={filters.scoreAbove80}
        onChange={(e) => onChange("scoreAbove80", e.target.checked)}
      />
      <span>Document score above 80</span>
    </label>

    <label className="safety-filter-pill">
      <input
        type="checkbox"
        checked={filters.safePackaging}
        onChange={(e) => onChange("safePackaging", e.target.checked)}
      />
      <span>Packaging document approved</span>
    </label>
  </div>
);

export default SafetyFilterBar;
