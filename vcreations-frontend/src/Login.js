import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Login() {
  const { login } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (!email.includes("@")) return setError("Enter a valid email address");
    setLoading(true);
    setError("");
    try {
      await axios.post("/auth/send-otp", { email });
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 4) return setError("Enter the OTP");
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/auth/verify-otp", { email, otp, name });
      login(res.data.email, res.data.name || name);
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <div className="checkout-summary" style={{ textAlign: "center", padding: 32 }}>
        <h2 style={{ marginBottom: 16 }}>{step === "email" ? "Sign In" : "Verify OTP"}</h2>
        <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
          {step === "email" ? "Enter your email to sign in" : `OTP sent to ${email}`}
        </p>

        {error && <p className="admin-error">{error}</p>}

        {step === "email" ? (
          <>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label>Name</label>
              <input className="input" type="text" placeholder="Your name"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label>Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-secondary" style={{ width: "100%", padding: 12, fontSize: 15 }}
              onClick={sendOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label>Enter OTP</label>
              <input className="input" type="text" maxLength={4} placeholder="1234"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", fontSize: 22, letterSpacing: 8, fontWeight: 700 }} />
            </div>
            <button className="btn btn-secondary" style={{ width: "100%", padding: 12, fontSize: 15 }}
              onClick={verifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8, fontSize: 13 }}
              onClick={() => { setStep("email"); setOtp(""); setError("") }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
