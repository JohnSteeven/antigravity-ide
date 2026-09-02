import React, { useEffect, useState } from "react";
import {
  FiMail,
  FiSend,
  FiUser,
  FiEdit3,
  FiHelpCircle,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiMessageSquare,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { contactMessageApi } from "../services/apiService";
import { useAuthContext } from "../context/AuthContext";
import "../styles/pages/contact.css";

const INQUIRY_TYPES = [
  "General Question",
  "Feedback",
  "Feature Request",
  "Bug Report",
  "Collaboration",
  "Business Inquiry",
  "Report Content",
  "Other",
];

const MAX_MESSAGE_LENGTH = 2000;

const Contact = () => {
  const { user } = useAuthContext();

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    inquiryType: "General Question",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Auto-fill form details if user is logged in
  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name:
          current.name ||
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "",
        email: current.email || user.email || "",
      }));
    }
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.subject.trim() ||
      !form.message.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    if (form.message.length > MAX_MESSAGE_LENGTH) {
      setError(
        `Message exceeds maximum limit of ${MAX_MESSAGE_LENGTH} characters.`
      );
      return;
    }

    setIsSubmitting(true);
    setSuccess("");
    setError("");
    try {
      await contactMessageApi.create(form);
      setSuccess(
        "Your message has been sent successfully. Thank you for getting in touch!"
      );
      setForm({
        name: user
          ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.username ||
            ""
          : "",
        email: user ? user.email || "" : "",
        subject: "",
        inquiryType: "General Question",
        message: "",
      });
    } catch (err) {
      setError(
        err.message || "Failed to send your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.main
      className="contact-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="contact-container">
        <div className="contact-layout">
          {/* Left Column: Editorial Introduction & Context */}
          <aside className="contact-intro">
            <span className="contact-kicker">Get in Touch</span>
            <h1 className="contact-title">Let's talk.</h1>
            <p className="contact-description">
              Have a question, feedback, partnership idea, or a story worth sharing?
              I read every message and look forward to connecting with you.
            </p>

            <div className="contact-info-card">
              <div className="contact-info-row">
                <div className="contact-info-icon">
                  <FiClock />
                </div>
                <div className="contact-info-text">
                  <span className="contact-info-label">Response Time</span>
                  <span className="contact-info-value">
                    Usually within 24–48 hours
                  </span>
                </div>
              </div>

              <div className="contact-info-row">
                <div className="contact-info-icon">
                  <FiMail />
                </div>
                <div className="contact-info-text">
                  <span className="contact-info-label">Direct Inquiries</span>
                  <span className="contact-info-value">
                    <a href="mailto:hello@myjourney.com">hello@myjourney.com</a>
                  </span>
                </div>
              </div>

              <div className="contact-info-row">
                <div className="contact-info-icon">
                  <FiMessageSquare />
                </div>
                <div className="contact-info-text">
                  <span className="contact-info-label">Collaborations</span>
                  <span className="contact-info-value">
                    Open to guest writing, speaking, and meaningful projects.
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Contact Form */}
          <section className="contact-card" aria-label="Contact Form">
            <div className="contact-card-header">
              <h2 className="contact-card-title">Send a Message</h2>
              <p className="contact-card-subtitle">
                Fill out the form below and I'll get back to you as soon as possible.
              </p>
            </div>

            {success && (
              <div
                className="contact-alert contact-alert-success"
                role="status"
                aria-live="polite"
              >
                <FiCheckCircle /> <span>{success}</span>
              </div>
            )}
            {error && (
              <div
                className="contact-alert contact-alert-error"
                role="alert"
                aria-live="assertive"
              >
                <FiAlertTriangle /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-name">
                  Full Name *
                </label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <FiUser />
                  </span>
                  <input
                    id="contact-name"
                    type="text"
                    className="contact-input"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-email">
                  Email Address *
                </label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <FiMail />
                  </span>
                  <input
                    id="contact-email"
                    type="email"
                    className="contact-input"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-inquiry-type">
                  Inquiry Type *
                </label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <FiHelpCircle />
                  </span>
                  <select
                    id="contact-inquiry-type"
                    className="contact-select"
                    value={form.inquiryType}
                    onChange={(e) => updateField("inquiryType", e.target.value)}
                  >
                    {INQUIRY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-subject">
                  Subject *
                </label>
                <div className="contact-input-wrap">
                  <span className="contact-input-icon">
                    <FiEdit3 />
                  </span>
                  <input
                    id="contact-subject"
                    type="text"
                    className="contact-input"
                    value={form.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    placeholder="What is this regarding?"
                    required
                  />
                </div>
              </div>

              <div className="contact-field">
                <div className="contact-label-row">
                  <label className="contact-label" htmlFor="contact-message">
                    Message *
                  </label>
                  <span
                    className={`contact-char-count ${
                      form.message.length > MAX_MESSAGE_LENGTH
                        ? "limit-warning"
                        : ""
                    }`}
                  >
                    {form.message.length} / {MAX_MESSAGE_LENGTH}
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  className="contact-textarea"
                  rows={5}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Share your message or question here..."
                  maxLength={MAX_MESSAGE_LENGTH}
                  required
                />
              </div>

              <button
                className="contact-submit-btn"
                type="submit"
                disabled={isSubmitting}
              >
                <FiSend />
                <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </motion.main>
  );
};

export default Contact;
