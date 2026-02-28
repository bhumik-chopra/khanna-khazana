import React from 'react';

const DishGrid = ({ dishes, onAddToCart }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}
    >
      {dishes.map((dish) => (
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
          </div>
        </article>
      ))}
    </div>
  );
};

export default DishGrid;
