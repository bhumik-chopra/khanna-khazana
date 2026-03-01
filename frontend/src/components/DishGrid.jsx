import React from 'react';

const qtyBtnStyle = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'var(--white)',
  cursor: 'pointer',
  fontSize: '1.1rem',
  fontWeight: 700,
  display: 'grid',
  placeItems: 'center'
};

const DishGrid = ({ dishes, cartItems, onAddToCart, onIncrease, onDecrease }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}
    >
      {dishes.map((dish) => {
        const inCart = cartItems?.[dish.id];
        const qty = inCart?.quantity || 0;

        return (
          <article
            key={dish.id}
            style={{
              background: 'var(--white)',
              borderRadius: 'var(--border-radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-soft)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={dish.image}
                alt={dish.name}
                style={{
                  height: 150,
                  width: '100%',
                  objectFit: 'cover'
                }}
              />
              {dish.isBestseller && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(255,122,26,0.93)',
                    color: 'var(--white)',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 999
                  }}
                >
                  ★ Bestseller
                </div>
              )}
            </div>

            <div style={{ padding: '0.8rem 0.9rem 0.9rem', flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.35rem'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{dish.name}</h3>
                <span style={{ fontWeight: 700 }}>₹{dish.price}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem'
                }}
              >
                <span>⭐ {dish.rating}</span>
                <span>•</span>
                <span>{dish.prepTime}</span>
                <span>•</span>
                <span>{dish.category}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.3rem',
                  marginBottom: '0.7rem'
                }}
              >
                {dish.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      borderRadius: 999,
                      padding: '0.12rem 0.55rem',
                      fontSize: '0.7rem',
                      background: 'rgba(0,0,0,0.03)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* ✅ Button turns into counter */}
              {qty === 0 ? (
                <button
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    paddingBlock: '0.55rem',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => onAddToCart(dish)}
                >
                  Add to cart
                </button>
              ) : (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.55rem 0.7rem',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background:
                      'linear-gradient(135deg, rgba(255,122,26,0.10), rgba(0,140,74,0.08))'
                  }}
                >
                  <button
                    style={qtyBtnStyle}
                    onClick={() => onDecrease(dish.id)}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{qty}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      in cart
                    </div>
                  </div>

                  <button
                    style={{
                      ...qtyBtnStyle,
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff7a1a, #008c4a)',
                      color: 'white'
                    }}
                    onClick={() => onIncrease(dish)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default DishGrid;