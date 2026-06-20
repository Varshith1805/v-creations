import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Checkout() {
  const { items, appliedOffers, clearCart } = useCart();
  const [form, setForm] = useState({ customerName: "", email: "", phone: "", address: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0 && !submitted) {
    return (
      <div className="cart-empty">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-light)" strokeWidth="1"><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p style={{marginBottom:16}}>Add some products before checking out</p>
        <Link to="/" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const total = items.reduce((s, { product, quantity }) => s + (appliedOffers[product._id]?.totalPrice || product.price * quantity), 0);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("/orders", {
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        items: items.map(({ product, quantity }) => {
          const info = appliedOffers[product._id];
          const itemPrice = info ? info.totalPrice / quantity : product.price;
          return {
            productId: product._id,
            name: product.name,
            quantity,
            price: itemPrice
          };
        })
      });
      setSubmitted(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{textAlign:"center",padding:"60px 0"}}>
        <div style={{fontSize:60,marginBottom:16}}>🎉</div>
        <h2 style={{marginBottom:8}}>Order Placed!</h2>
        <p style={{fontSize:18,marginBottom:24}}>Thank you, {form.customerName}. Your order has been placed successfully.</p>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>
      <div className="checkout-layout">
        <div>
          <div className="checkout-summary" style={{marginBottom:24}}>
            <h3>Order Summary</h3>
            {items.map(({ product, quantity }) => (
              <div className="checkout-line" key={product._id}>
                <span>{product.name} × {quantity}</span>
                <span>₹{product.price * quantity}</span>
              </div>
            ))}
            <div className="checkout-line total">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="checkout-summary">
            <h3>Shipping Details</h3>
            {error && <p className="admin-error">{error}</p>}
            <form className="checkout-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="input" name="customerName" value={form.customerName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="input" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="input" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea className="input" name="address" value={form.address} onChange={handleChange} rows={3} style={{resize:"vertical"}} />
              </div>
              <button type="submit" className="btn btn-secondary" style={{width:"100%",padding:"14px",fontSize:16}} disabled={loading}>
                {loading ? <><span className="spinner" /> Placing Order...</> : "Place Order"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
