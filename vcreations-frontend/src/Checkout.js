import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Checkout() {
  const { items, appliedOffers, clearCart } = useCart();
  const [form, setForm] = useState({ customerName: "", email: "", phone: "", address: "", pincode: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [config, setConfig] = useState({ upiId: "", whatsappNumber: "" });

  useEffect(() => {
    axios.get("/config").then(r => setConfig(r.data)).catch(() => {});
  }, []);

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
      const res = await axios.post("/orders", {
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        pincode: form.pincode,
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
      setLastOrder(res.data.order);
      setSubmitted(true);
      clearCart();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    const orderId = lastOrder?._id?.slice(-8)?.toUpperCase() || "";
    const amount = lastOrder?.totalAmount || total;
    const waText = encodeURIComponent(
      `Hi! I placed an order on V Creations.%0AOrder: ${orderId}%0ATotal: ₹${amount}%0APlease confirm payment.`
    );
    const waUrl = `https://wa.me/${config.whatsappNumber}?text=${waText}`;
    const upiLink = `upi://pay?pa=${config.upiId}&pn=V%20Creations&am=${amount}&cu=INR&tn=Order%20%23${orderId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
    return (
      <div style={{textAlign:"center",padding:"40px 0",maxWidth:480,margin:"0 auto"}}>
        <div style={{fontSize:60,marginBottom:16}}>🎉</div>
        <h2 style={{marginBottom:8}}>Order Placed!</h2>
        <p style={{fontSize:18,marginBottom:8}}>Thank you, {form.customerName}.</p>
        <p style={{color:"#666",marginBottom:24}}>
          Order ID: <strong>#{orderId}</strong>
        </p>
          <div style={{background:"#f5faff",border:"2px solid var(--c-primary)",borderRadius:12,padding:24,marginBottom:24}}>
          <h3 style={{color:"var(--c-primary)",marginBottom:16,fontSize:18,textAlign:"center"}}>💳 Pay ₹{amount}</h3>

          <div style={{textAlign:"center",marginBottom:16}}>
            <img src={qrUrl} alt="UPI QR" style={{width:200,height:200,borderRadius:8}} />
          </div>

          <div style={{fontSize:16,fontWeight:700,color:"#111",background:"white",padding:"10px 16px",borderRadius:8,border:"1px solid #ddd",marginBottom:12,textAlign:"center"}}>
            {config.upiId}
          </div>

          <a href={upiLink}
            className="btn"
            style={{display:"block",textAlign:"center",background:"var(--c-primary)",color:"white",fontWeight:700,fontSize:15,padding:"12px",borderRadius:8,textDecoration:"none",marginBottom:16}}>
            Pay via UPI App →
          </a>

          <hr style={{border:"none",borderTop:"1px dashed #ccc",marginBottom:16}} />

          <p style={{fontSize:14,color:"#555",marginBottom:12,textAlign:"center",fontWeight:500}}>
            Done paying? Confirm instantly on WhatsApp
          </p>

          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="btn"
            style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"#25D366",color:"white",fontWeight:700,fontSize:16,padding:"14px 24px",borderRadius:8,textDecoration:"none"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ✅ Confirm Payment on WhatsApp
          </a>
        </div>
        <Link to="/orders" className="btn btn-primary" style={{marginRight:8}}>View My Orders</Link>
        <Link to="/" className="btn btn-secondary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h2 style={{color:"var(--c-primary)"}}>Checkout</h2>
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
                <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea className="input" name="address" value={form.address} onChange={handleChange} rows={3} style={{resize:"vertical"}} required />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input className="input" name="pincode" value={form.pincode} onChange={handleChange} required />
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
