import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Cart() {
  const { items, appliedOffers, updateQuantity, removeFromCart, applyOffer: applyOfferCtx } = useCart();
  const [offerPopup, setOfferPopup] = useState(null);
  const prevQty = useRef({});

  const checkOffer = useCallback(async (product, quantity) => {
    try {
      const res = await axios.post("/products/calculate-price", {
        productId: product._id,
        quantity
      });
      if (res.data.discountMessage) {
        setOfferPopup({ msg: res.data.discountMessage, productId: product._id, quantity });
        setTimeout(() => setOfferPopup(null), 5000);
      }
    } catch { /* ignore */ }
  }, []);

  const applyOffer = useCallback(async (product, quantity) => {
    try {
      const res = await axios.post("/products/calculate-price", {
        productId: product._id,
        quantity
      });
      applyOfferCtx(product._id, res.data);
      setOfferPopup(null);
    } catch { /* ignore */ }
  }, [applyOfferCtx]);

  // Show offer popup when quantity changes (but don't auto-apply)
  useEffect(() => {
    items.forEach(async ({ product, quantity }) => {
      const prev = prevQty.current[product._id] || 0;
      if (quantity > prev) {
        checkOffer(product, quantity);
      }
      prevQty.current[product._id] = quantity;
    });
  }, [items, checkOffer]);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-light)" strokeWidth="1"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p style={{marginBottom:16}}>Looks like you haven't added anything yet</p>
        <Link to="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const total = items.reduce((s, { product, quantity }) => s + (appliedOffers[product._id]?.totalPrice || product.price * quantity), 0);

  return (
    <div className="cart-page">
      {offerPopup && (
        <div className="toast" style={{ bottom: 80, display: "flex", alignItems: "center", gap: 12 }}>
          <span>🎉 {offerPopup.msg}</span>
          <button className="btn btn-primary" style={{ padding: "6px 16px", fontSize: 13, whiteSpace: "nowrap" }} onClick={() => {
            const item = items.find(i => i.product._id === offerPopup.productId);
            if (item) applyOffer(item.product, offerPopup.quantity);
          }}>Apply</button>
        </div>
      )}
      <h2>Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})</h2>
      <div className="cart-items">
        {items.map(({ product, quantity }) => {
          const info = appliedOffers[product._id];
          const hasOffer = product.offers && product.offers.length > 0;
          return (
          <div className="cart-item" key={product._id}>
            <img className="cart-item-img" src={product.image || "https://via.placeholder.com/100"} alt={product.name} />
            <div className="cart-item-info">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="cart-qty">
                <button onClick={() => updateQuantity(product._id, quantity - 1)}>−</button>
                <span>{quantity}</span>
                <button onClick={() => updateQuantity(product._id, quantity + 1)}>+</button>
              </div>
            </div>
            <div className="cart-item-total">
              <div className="price">₹{info?.totalPrice || product.price * quantity}</div>
              {info?.discountMessage && <div style={{fontSize:11,color:"var(--c-gold)",marginTop:2}}>Offer applied!</div>}
              <div className="cart-item-actions">
                {hasOffer && <button className="btn-offer" onClick={() => applyOffer(product, quantity)}>Apply Offer</button>}
                <button className="btn-remove" onClick={() => { prevQty.current[product._id] = 0; removeFromCart(product._id); }}>Remove</button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,flexWrap:"wrap",gap:12}}>
        <div style={{fontSize:22,fontWeight:700}}>Total: <span style={{color:"var(--c-primary)"}}>₹{total}</span></div>
        <Link to="/checkout" className="btn btn-secondary" style={{padding:"14px 32px",fontSize:16}}>Proceed to Checkout →</Link>
      </div>
    </div>
  );
}
