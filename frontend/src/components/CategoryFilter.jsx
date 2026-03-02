import React from "react";

const CategoryFilter = ({ activeCategory, onChange, categories }) => {
  const list = categories?.length ? categories : ["All"];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        justifyContent: "center",
        marginBottom: "1.6rem"
      }}
    >
      {list.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              borderRadius: 999,
              padding: "0.45rem 0.95rem",
              border: isActive ? "none" : "1px solid rgba(0,0,0,0.08)",
              background: isActive
                ? "linear-gradient(135deg, #ff7a1a, #008c4a)"
                : "var(--white)",
              color: isActive ? "var(--white)" : "var(--text-dark)",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: isActive ? "0 8px 16px rgba(0,0,0,0.12)" : "none"
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;