import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Login() {
  const { login } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const successMsg = location.state?.success || "";

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/login", { email, password });
      login(res.data.email, res.data.name || "");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <div className="checkout-summary" style={{ textAlign: "center", padding: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Login</h2>
        <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>Enter your email and password to login</p>

        {successMsg && <p style={{color:"#007600",background:"#e8f5e9",padding:"10px 16px",borderRadius:8,marginBottom:12,fontSize:14}}>{successMsg}</p>}
        {error && <p className="admin-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label>Email</label>
            <input className="input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label>Password</label>
            <input className="input" type="password" placeholder="At least 6 characters"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: "100%", padding: 12, fontSize: 15 }}
            disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--c-primary)", fontWeight: 600, textDecoration: "none" }}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}
