import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext";

export default function UserOrders() {
  const { userEmail, userName, logout } = useCart();
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
        <div>
          {userName && <p style={{ fontSize: 14, color: "#666", margin: 0 }}>Welcome, <strong style={{ color: "#111" }}>{userName}</strong></p>}
          <h2 style={{ margin: 0 }}>My Orders</h2>
        </div>
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
            <div key={o._id} style={{ background: "white", border: "1px solid var(--c-border)", padding: 16, borderRadius: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: "#555" }}>{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span style={{ fontWeight: 700, color: o.status === "pending" ? "#c77000" : "#007600" }}>{o.status}</span>
              </div>
              <div style={{ fontSize: 15, color: "#111", marginBottom: 6, fontWeight: 500 }}>
                {o.products.map(p => `${p.name} x${p.quantity}`).join(", ")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {o.phone && <span style={{ fontSize: 13, color: "#444" }}>{o.phone}</span>}
                  {o.address && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{o.address}</div>}
                  {o.pincode && <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>Pincode: {o.pincode}</div>}
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--c-primary)" }}>₹{o.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
