import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "./CartContext";

export default function Login() {
  const { login } = useCart();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (mobile.length < 10) return setError("Enter a valid 10-digit mobile number");
    setLoading(true);
    setError("");
    try {
      await axios.post("/auth/send-otp", { mobile: "+91" + mobile });
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
      const res = await axios.post("/auth/verify-otp", { mobile: "+91" + mobile, otp });
      login(res.data.mobile);
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
        <h2 style={{ marginBottom: 16 }}>{step === "mobile" ? "Sign In" : "Verify OTP"}</h2>
        <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
          {step === "mobile" ? "Enter your mobile number to receive an OTP" : `OTP sent to +91-${mobile}`}
        </p>

        {error && <p className="admin-error">{error}</p>}

        {step === "mobile" ? (
          <>
            <div className="form-group" style={{ textAlign: "left" }}>
              <label>Mobile Number</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>+91</span>
                <input className="input" type="tel" maxLength={10} placeholder="9876543210"
                  value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                  style={{ flex: 1 }} />
              </div>
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
              onClick={() => { setStep("mobile"); setOtp(""); setError("") }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
