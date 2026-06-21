import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

function AdminToast({ orders }) {
  const latest = orders[orders.length - 1];
  if (!latest) return null;
  return (
    <div className="toast" style={{ bottom: 80 }}>
      <span>🪢 New order from <strong>{latest.customerName}</strong> — ₹{latest.totalAmount}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const prevCount = useRef(0);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", image: "", category: "", offers: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchData = useCallback(() => {
    axios.get("/products").then(res => setProducts(res.data)).catch(() => {});
    axios.get("/admin/orders").then(res => {
      const incoming = res.data;
      if (incoming.length > prevCount.current && prevCount.current > 0) {
        const newOrder = incoming[incoming.length - 1];
        setNewOrderAlert(newOrder);
        setTimeout(() => setNewOrderAlert(null), 5000);
      }
      prevCount.current = incoming.length;
      setOrders(incoming);
    }).catch(() => {});
    axios.get("/admin/sales").then(res => setSales(res.data.totalSales)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    try {
      await axios.post("/products/add", {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        offers: form.offers ? form.offers.split(",").map(s => { const [qty, p] = s.trim().split("for"); return qty ? { quantity: parseInt(qty.trim()), price: parseInt(p.trim()) } : s.trim(); }) : []
      });
      setMessage({ text: "Product added successfully!", type: "success" });
      setForm({ name: "", description: "", price: "", stock: "", image: "", category: "", offers: "" });
      fetchData();
    } catch (err) {
      setMessage({ text: "Error: " + (err.response?.data || err.message), type: "error" });
    }
  };

  return (
    <div className="admin-page">
      {newOrderAlert && <AdminToast orders={[newOrderAlert]} />}

      <h2>Admin Dashboard</h2>
      <div className="admin-grid">
        <div className="admin-card">
          <h3>Total Sales</h3>
          <div className="admin-stat">₹{sales}</div>
        </div>
        <div className="admin-card" style={{ background: newOrderAlert ? "linear-gradient(135deg, var(--c-primary), #8B0000)" : undefined, transition: "background 0.5s" }}>
          <h3 style={newOrderAlert ? { color: "#FFD700" } : undefined}>
            Orders ({orders.length})
            {newOrderAlert && <span style={{ marginLeft: 8, fontSize: 12, background: "#FFD700", color: "#000", padding: "2px 8px", borderRadius: 12 }}>NEW</span>}
          </h3>
          <ul className="admin-list">
            {orders.map(o => (
              <li key={o._id} style={newOrderAlert?._id === o._id ? { background: "rgba(255,215,0,0.15)", borderRadius: 6, fontWeight: 600 } : undefined}>
                <div>
                  <strong>{o.customerName}</strong>
                  {o.address && <div style={{fontSize:12,color:"var(--c-text-light)",marginTop:2}}>{o.address}{o.pincode ? ` - ${o.pincode}` : ""}{o.phone ? ` · ${o.phone}` : ""}</div>}
                </div>
                <span>₹{o.totalAmount} · {new Date(o.createdAt).toLocaleTimeString()}</span>
              </li>
            ))}
            {orders.length === 0 && <li style={{ color: "var(--c-text-light)", fontStyle: "italic" }}>No orders yet</li>}
          </ul>
        </div>
        <div className="admin-card">
          <h3>Products ({products.length})</h3>
          <ul className="admin-list">
            {products.map(p => <li key={p._id}><span>{p.name}</span><span>₹{p.price} · Stock: {p.stock}</span></li>)}
            {products.length === 0 && <li style={{ color: "var(--c-text-light)", fontStyle: "italic" }}>No products yet — add one below</li>}
          </ul>
        </div>
        <div className="admin-card">
          <h3>Add Product</h3>
          {message.text && <p className={message.type === "success" ? "admin-success" : "admin-error"}>{message.text}</p>}
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input className="input" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input className="input" name="price" type="number" value={form.price} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stock *</label>
                <input className="input" name="stock" type="number" value={form.stock} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input className="input" name="category" value={form.category} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input className="input" name="image" value={form.image} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input className="input" name="description" value={form.description} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Offers (comma-sep)</label>
              <input className="input" name="offers" value={form.offers} onChange={handleChange} placeholder="e.g. 2 for 99" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}>Add Product</button>
          </form>
        </div>
      </div>
    </div>
  );
}
