import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Cart() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const [priceInfo, setPriceInfo] = useState({});
  const [offerPopup, setOfferPopup] = useState(null);
  const prevQty = useRef({});

  const calculatePrice = useCallback(async (product, quantity) => {
    try {
      const res = await axios.post("/products/calculate-price", {
        productId: product._id,
        quantity
      });
      setPriceInfo(prev => ({ ...prev, [product._id]: res.data }));
      return res.data;
    } catch { return null; }
  }, []);

  // Auto-apply offer when quantity changes + show popup
  useEffect(() => {
    items.forEach(async ({ product, quantity }) => {
      const prev = prevQty.current[product._id] || 0;
      if (quantity > prev) {
        const info = await calculatePrice(product, quantity);
        if (info?.discountMessage) {
          setOfferPopup(info.discountMessage);
          setTimeout(() => setOfferPopup(null), 4000);
        }
      }
      prevQty.current[product._id] = quantity;
    });
  }, [items, calculatePrice]);

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

  const total = items.reduce((s, { product, quantity }) => s + (priceInfo[product._id]?.totalPrice || product.price * quantity), 0);

  return (
    <div className="cart-page">
      {offerPopup && <div className="toast" style={{ bottom: 80 }}><span>🎉 {offerPopup}</span></div>}
      <h2>Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})</h2>
      <div className="cart-items">
        {items.map(({ product, quantity }) => {
          const info = priceInfo[product._id];
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
