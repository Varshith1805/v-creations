import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function UserOrders() {
  const { userEmail, logout } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    axios.get(`/auth/orders/${encodeURIComponent(userEmail)}`)
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (!userEmail) {
    return (
      <div className="cart-empty">
        <h3>Please sign in to view your orders</h3>
        <Link to="/login" className="btn btn-secondary" style={{ marginTop: 16 }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>My Orders</h2>
        <button className="btn btn-ghost" onClick={logout} style={{ fontSize: 12 }}>Sign Out</button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#999" }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="cart-empty">
          <h3>No orders yet</h3>
          <p style={{ marginBottom: 16 }}>Start shopping to see your orders here</p>
          <Link to="/" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.map(o => (
            <div key={o._id} style={{ background: "white", border: "1px solid #e8e8e8", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "#666" }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span style={{ fontWeight: 700, color: o.status === "pending" ? "var(--c-accent-dark)" : "#007600" }}>{o.status}</span>
              </div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 6 }}>
                {o.products.map(p => `${p.name} x${p.quantity}`).join(", ")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#999" }}>{o.phone} · {o.address}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-primary)" }}>₹{o.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
