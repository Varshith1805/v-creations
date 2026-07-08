import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      await axios.post("/auth/signup", { name, email, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <div className="checkout-summary" style={{ textAlign: "center", padding: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Create Account</h2>
        <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>Create your V Creations account</p>

        {error && <p className="admin-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label>Name</label>
            <input className="input" type="text" placeholder="Your name"
              value={name} onChange={e => setName(e.target.value)} required />
          </div>
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--c-primary)", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
