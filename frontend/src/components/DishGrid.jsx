import React from "react";
import StarBorder from "./StarBorder";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const qtyBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 12,
  cursor: "pointer",
  fontSize: "1.1rem",
  fontWeight: 700,
  display: "grid",
  placeItems: "center"
};

const DishGrid = ({ dishes = [], cartItems = {}, onAddToCart, onIncrease, onDecrease }) => {
  return (
    <div className="dish-grid">
      {dishes.map((dish) => {
        const id = dish.id || dish._id;
        const inCart = cartItems?.[id];
        const qty = inCart?.quantity || 0;

        const imgPath = dish.imageUrl || dish.image || "";
        const imgSrc =
          imgPath && imgPath.startsWith("http")
            ? imgPath
            : `${API_BASE}${imgPath?.startsWith("/") ? "" : "/"}${imgPath}`;

        const tagsArr = Array.isArray(dish.tags)
          ? dish.tags
          : typeof dish.tags === "string"
            ? dish.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [];

        return (
          <StarBorder key={id} as="div" radius={22} className="dish-grid-border" color="orange" speed="5s">
            <article className="dish-card">
              <div className="dish-card-media">
                <img
                  src={imgSrc}
                  alt={dish.name}
                  className="dish-image"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0.2";
                  }}
                />

                {dish.isBestseller && <div className="dish-badge">Bestseller</div>}
              </div>

              <div className="dish-card-body">
                <div className="dish-card-heading">
                  <h3>{dish.name}</h3>
                  <span className="dish-price">Rs {dish.price}</span>
                </div>

                <div className="dish-meta">
                  <span>Star {dish.rating}</span>
                  <span>{dish.prepTime}</span>
                  <span>{dish.category}</span>
                </div>

                <div className="dish-tags">
                  {tagsArr.map((tag) => (
                    <span key={tag} className="dish-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {qty === 0 ? (
                  <button className="btn btn-primary dish-action-button cursor-target" onClick={() => onAddToCart(dish)}>
                    Add to cart
                  </button>
                ) : (
                  <div className="dish-qty-wrap">
                    <button
                      style={qtyBtnStyle}
                      onClick={() => onDecrease(id)}
                      aria-label="Decrease quantity"
                      className="cursor-target dish-qty-btn"
                    >
                      -
                    </button>

                    <div className="dish-qty-count">
                      <div>{qty}</div>
                      <span>in cart</span>
                    </div>

                    <button
                      style={qtyBtnStyle}
                      onClick={() => onIncrease(dish)}
                      aria-label="Increase quantity"
                      className="cursor-target dish-qty-btn is-plus"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </article>
          </StarBorder>
        );
      })}
    </div>
  );
};

export default DishGrid;
