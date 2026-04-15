import React, { useState } from "react";
import { motion } from "framer-motion";
import StarBorder from "./StarBorder";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const DishCard = ({ dish, qty, onAddToCart, onIncrease, onDecrease }) => {
  const [flipped, setFlipped] = useState(false);
  const id = dish.id || dish._id;

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
  const starCount = 3;

  const metaItems = [
    dish.prepTime || "Quick serve",
    dish.category || "Chef special"
  ].filter(Boolean);

  const description =
    dish.description?.trim() || "Built with bold spice, smooth texture, and a kitchen-fresh finish.";

  const stopCardFlip = (event) => {
    event.stopPropagation();
  };

  const ratingBadges = Array.from({ length: starCount }, (_, index) => (
    <span key={`star-${index}`} className="dish-rating-badge" aria-hidden="true" />
  ));

  return (
    <StarBorder as="div" radius={22} className="dish-grid-border" color="orange" speed="5s">
      <motion.article className="dish-card-scene" whileTap={{ scale: 0.97 }}>
        <motion.div
          className="dish-card-shell"
          onClick={() => setFlipped((current) => !current)}
        >
          <motion.div
            className="dish-card-inner"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          >
            <div className="dish-card-face dish-card-front">
              <div className="dish-card-glow" />

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

                <button
                  type="button"
                  className="dish-flip-button"
                  onClick={(event) => {
                    stopCardFlip(event);
                    setFlipped(true);
                  }}
                >
                  Details
                </button>
              </div>

              <div className="dish-card-body">
                <div className="dish-card-heading">
                  <h3>{dish.name}</h3>
                  <span className="dish-price">Rs {dish.price}</span>
                </div>

                <p className="dish-description">{description}</p>

                <div className="dish-meta">
                  <span className="dish-rating-icons" aria-label={`${starCount} star dish`}>
                    {ratingBadges}
                  </span>
                  {metaItems.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                {qty === 0 ? (
                  <button
                    className="btn btn-primary dish-action-button cursor-target"
                    onClick={(event) => {
                      stopCardFlip(event);
                      onAddToCart(dish);
                    }}
                  >
                    Add to cart
                  </button>
                ) : (
                  <div className="dish-qty-wrap" onClick={stopCardFlip}>
                    <button
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
                      onClick={() => onIncrease(dish)}
                      aria-label="Increase quantity"
                      className="cursor-target dish-qty-btn is-plus"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="dish-card-face dish-card-back">
              <div className="dish-card-glow dish-card-glow-back" />

              <div className="dish-card-back-content">
                <div className="dish-card-back-top">
                  <span className="dish-back-tag">{dish.category || "Signature plate"}</span>
                  <button
                    type="button"
                    className="dish-flip-button is-back"
                    onClick={(event) => {
                      stopCardFlip(event);
                      setFlipped(false);
                    }}
                  >
                    Back
                  </button>
                </div>

                <div className="dish-card-heading">
                  <h3>{dish.name}</h3>
                  <span className="dish-price">Rs {dish.price}</span>
                </div>

                <p className="dish-description">{description}</p>

                <div className="dish-tags">
                  {tagsArr.length ? (
                    tagsArr.map((tag) => (
                      <span key={tag} className="dish-tag">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="dish-tag">Chef crafted</span>
                  )}
                </div>

                <ul className="dish-feature-list">
                  <li className="dish-feature-rating">
                    <span className="dish-rating-icons" aria-label={`${starCount} star dish`}>
                      {ratingBadges}
                    </span>
                  </li>
                  {metaItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  {dish.isBestseller && <li>Customer favourite this week</li>}
                </ul>

                {qty === 0 ? (
                  <button
                    className="btn btn-primary dish-action-button cursor-target"
                    onClick={(event) => {
                      stopCardFlip(event);
                      onAddToCart(dish);
                    }}
                  >
                    Add to cart
                  </button>
                ) : (
                  <div className="dish-qty-wrap" onClick={stopCardFlip}>
                    <button
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
                      onClick={() => onIncrease(dish)}
                      aria-label="Increase quantity"
                      className="cursor-target dish-qty-btn is-plus"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.article>
    </StarBorder>
  );
};

const DishGrid = ({ dishes = [], cartItems = {}, onAddToCart, onIncrease, onDecrease }) => {
  return (
    <div className="dish-grid">
      {dishes.map((dish) => {
        const id = dish.id || dish._id;
        const inCart = cartItems?.[id];
        const qty = inCart?.quantity || 0;

        return (
          <DishCard
            key={id}
            dish={dish}
            qty={qty}
            onAddToCart={onAddToCart}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
          />
        );
      })}
    </div>
  );
};

export default DishGrid;
