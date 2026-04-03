import React from "react";

const CartDrawer = ({
  isOpen,
  cartItems,
  subtotal,
  itemCount,
  isCheckingOut,
  onClose,
  onCheckout,
  onIncrease,
  onDecrease,
  onRemove
}) => {
  const items = Object.values(cartItems);

  return (
    <div className="cart-drawer-shell" style={{ pointerEvents: isOpen ? "auto" : "none" }}>
      <div onClick={onClose} className="cart-drawer-backdrop" style={{ opacity: isOpen ? 1 : 0 }} />

      <aside className="cart-drawer" style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}>
        <div className="cart-drawer-header">
          <div>
            <div className="cart-drawer-title">Your cart</div>
            <div className="cart-drawer-subtitle">
              {items.length === 0
                ? "No items yet, add something spectacular from the menu."
                : `${items.length} item(s) in cart`}
            </div>
          </div>
          <button onClick={onClose} className="cart-close-button">
            x
          </button>
        </div>

        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              Your cart is empty. Start with Butter Chicken, Masala Dosa, or Pani Puri.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-line-item">
                <div className="cart-line-top">
                  <div className="cart-line-copy">
                    <div className="cart-line-name">{item.name}</div>
                    <div className="cart-line-price">Rs {item.price} each</div>
                  </div>

                  <button onClick={() => onRemove(item.id)} className="cart-remove-button" title="Remove item">
                    Remove
                  </button>
                </div>

                <div className="cart-line-actions">
                  <div className="cart-counter">
                    <button onClick={() => onDecrease(item.id)} className="cart-counter-button">
                      -
                    </button>
                    <div className="cart-counter-value">{item.quantity}</div>
                    <button onClick={() => onIncrease(item)} className="cart-counter-button is-plus">
                      +
                    </button>
                  </div>

                  <div className="cart-line-total">Rs {item.price * item.quantity}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-drawer-footer">
          <div className="cart-checkout-card">
            <div className="cart-checkout-badge">Secure checkout</div>
            <div className="cart-subtotal-row">
              <span>Items</span>
              <strong>{itemCount}</strong>
            </div>
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <strong>Rs {subtotal}</strong>
            </div>
            <div className="cart-payment-note">
              Pay with Razorpay test mode and place your order instantly after successful payment.
            </div>
          </div>

          <button
            className="btn btn-primary cart-checkout-button"
            disabled={items.length === 0 || isCheckingOut}
            onClick={onCheckout}
          >
            {items.length === 0
              ? "Add items to continue"
              : isCheckingOut
                ? "Opening Razorpay..."
                : "Proceed to checkout"}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default CartDrawer;
