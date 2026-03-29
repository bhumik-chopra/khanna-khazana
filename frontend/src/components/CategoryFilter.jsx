import React from "react";

const CategoryFilter = ({ activeCategory, onChange, categories }) => {
  const list = categories?.length ? categories : ["All"];

  return (
    <div className="category-filter">
      {list.map((cat) => {
        const isActive = cat === activeCategory;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`category-pill ${isActive ? "is-active" : ""}`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
