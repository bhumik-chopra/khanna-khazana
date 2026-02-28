import React from 'react';

const CartDrawer = ({ isOpen, cartItems, onClose }) => {
  const items = Object.values(cartItems);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: isOpen ? 'auto' : 'none',
        zIndex: 50
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Drawer */}
      <aside
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: 'min(360px, 100%)',
          background: 'var(--white)',
          boxShadow: '-10px 0 20px rgba(0,0,0,0.12)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.26s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '1rem 1.1rem',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>Your cart</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {items.length === 0
                ? 'No items yet — add something tasty from the menu.'
                : `${items.length} item(s) in cart`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              borderRadius: '999px',
              border: 'none',
              background: 'rgba(0,0,0,0.05)',
              width: 28,
              height: 28,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.9rem 1.1rem'
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
              }}
            >
              Your cart is empty. Start by adding a Butter Chicken, a Masala Dosa, or
              some Pani Puri – we won’t judge. 😉
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Qty: {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            padding: '0.9rem 1.1rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.6rem',
              fontSize: '0.9rem'
            }}
          >
            <span>Subtotal</span>
            <strong>₹{subtotal}</strong>
          </div>
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              paddingBlock: '0.65rem',
              justifyContent: 'center',
              fontSize: '0.9rem'
            }}
            disabled={items.length === 0}
          >
            {items.length === 0 ? 'Add items to continue' : 'Proceed to checkout'}
          </button>
          <p
            style={{
              marginTop: '0.45rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >

          </p>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
