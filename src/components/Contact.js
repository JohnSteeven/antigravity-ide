import { useState } from "react";
import { FiMail, FiSend, FiUser, FiEdit3, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { motion } from "framer-motion";
import { contactMessageApi } from "../services/apiService";

const Contact = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill out all fields.");
      return;
    }
    setIsSubmitting(true);
    setSuccess("");
    setError("");
    try {
      await contactMessageApi.create(form);
      setSuccess("Your message has been sent successfully. Thank you!");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setError(err.message || "Failed to send your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      animate={{ opacity: 1 }}
      className="story-page"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="story-hero" style={{ minHeight: "35vh", height: "35vh" }}>
        <div className="story-hero-overlay"></div>
        <div className="story-hero-content">
          <h1>Contact Me</h1>
          <p>Have a question, feedback, or just want to say hello? I'd love to hear from you.</p>
        </div>
      </section>

      <section style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="cms-panel" style={{ padding: "30px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--bg-card)" }}>
          <div className="cms-panel-heading" style={{ marginBottom: "20px" }}>
            <div>
              <span className="section-kicker">Get in Touch</span>
              <h2>Send a Message</h2>
            </div>
          </div>

          {success && (
            <div className="cms-alert cms-alert-success" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "20px" }}>
              <FiCheckCircle /> <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="cms-alert cms-alert-danger" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "20px" }}>
              <FiAlertTriangle /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid one" style={{ gap: "20px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "0.9rem" }}>
              Full Name
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <FiUser style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="John Doe"
                  style={{ paddingLeft: "38px", width: "100%", height: "44px", borderRadius: "6px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "0.9rem" }}>
              Email Address
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <FiMail style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                  style={{ paddingLeft: "38px", width: "100%", height: "44px", borderRadius: "6px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "0.9rem" }}>
              Subject
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <FiEdit3 style={{ position: "absolute", left: "12px", color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                  placeholder="What is this about?"
                  style={{ paddingLeft: "38px", width: "100%", height: "44px", borderRadius: "6px", border: "1px solid var(--border)" }}
                  required
                />
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "600", fontSize: "0.9rem" }}>
              Message
              <textarea
                rows="6"
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                placeholder="Type your message here..."
                style={{ padding: "12px", width: "100%", borderRadius: "6px", border: "1px solid var(--border)", resize: "vertical" }}
                required
              />
            </label>

            <button
              className="primary-btn"
              type="submit"
              disabled={isSubmitting}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "46px", marginTop: "10px", width: "100%", cursor: "pointer" }}
            >
              <FiSend /> {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </motion.main>
  );
};

export default Contact;
