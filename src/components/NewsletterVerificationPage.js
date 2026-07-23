import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { subscriberApi } from "../services/apiService";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

export default function NewsletterVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const runVerify = async () => {
      try {
        const res = await subscriberApi.verify(token);
        setStatus("success");
        setMessage(res.message || "Your subscription has been verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage(err.message || "Verification link is invalid or expired.");
      }
    };

    runVerify();
  }, [token]);

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "3rem 2rem", maxWidth: "500px", width: "100%", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
        {status === "verifying" && (
          <div>
            <FiLoader className="spinner" style={{ fontSize: "3rem", color: "#426c67", marginBottom: "1rem" }} />
            <h2 style={{ fontFamily: "Georgia, serif" }}>Verifying your email...</h2>
            <p style={{ color: "#718096" }}>Please wait while we confirm your newsletter subscription.</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <FiCheckCircle style={{ fontSize: "3.5rem", color: "#22c55e", marginBottom: "1rem" }} />
            <h2 style={{ fontFamily: "Georgia, serif", color: "#1a202c" }}>Subscription Confirmed!</h2>
            <p style={{ color: "#4a5568", margin: "1rem 0 1.5rem 0", lineHeight: 1.6 }}>{message}</p>
            <Link to="/" className="btn btn-primary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", background: "#426c67", color: "#fff", textDecoration: "none", borderRadius: "6px" }}>
              Return to Homepage
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <FiAlertCircle style={{ fontSize: "3.5rem", color: "#ef4444", marginBottom: "1rem" }} />
            <h2 style={{ fontFamily: "Georgia, serif", color: "#991b1b" }}>Verification Link Invalid</h2>
            <p style={{ color: "#7f1d1d", margin: "1rem 0 1.5rem 0", lineHeight: 1.6 }}>{message}</p>
            <Link to="/#newsletter" className="btn btn-secondary" style={{ display: "inline-block", padding: "0.75rem 1.5rem", textDecoration: "none", borderRadius: "6px" }}>
              Subscribe Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
