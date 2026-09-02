import React from "react";

const NewsletterPanel = ({
  newsletterEmail = "",
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg = "",
  category = "",
}) => {
  const isCoding = category === "coding";

  if (isCoding) {
    return (
      <div
        className="coding-sidebar-panel coding-newsletter-panel"
        style={{
          background: "#172033",
          color: "#f8fafc",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: "8px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "10px",
          }}
        >
          Newsletter
        </h3>
        <p
          style={{
            color: "#94a3b8",
            fontSize: "14px",
            lineHeight: 1.5,
            marginBottom: "16px",
          }}
        >
          Get the latest stories, incident reports, and lessons in your inbox weekly.
        </p>
        <form onSubmit={handleNewsletterSubmit}>
          <input
            type="email"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              background: "#0f172a",
              color: "#f8fafc",
              border: "1.5px solid #334155",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "12px",
            }}
          />
          <button
            type="submit"
            className="coding-newsletter-btn"
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "12px 20px",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              width: "100%",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            Subscribe
          </button>
        </form>
        {newsletterMsg && (
          <span
            className="newsletter-msg"
            style={{
              color: "#38bdf8",
              marginTop: "8px",
              display: "block",
              fontSize: "13px",
            }}
          >
            {newsletterMsg}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="right-sidebar-panel newsletter-panel detail-card detail-card--dark">
      <h3>Newsletter</h3>
      <p>Get the latest stories, incident reports, and lessons in your inbox weekly.</p>
      <form onSubmit={handleNewsletterSubmit}>
        <input
          type="email"
          value={newsletterEmail}
          onChange={(e) => setNewsletterEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <button type="submit" className="primary-btn newsletter-btn detail-primary-action">
          Subscribe
        </button>
      </form>
      {newsletterMsg && <span className="newsletter-msg">{newsletterMsg}</span>}
    </div>
  );
};

export default NewsletterPanel;
