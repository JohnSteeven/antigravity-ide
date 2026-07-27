import React from "react";

const NewsletterPanel = ({
  newsletterEmail = "",
  setNewsletterEmail,
  handleNewsletterSubmit,
  newsletterMsg = "",
}) => {
  return (
    <div className="right-sidebar-panel newsletter-panel">
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
        <button type="submit" className="primary-btn newsletter-btn">Subscribe</button>
      </form>
      {newsletterMsg && <span className="newsletter-msg">{newsletterMsg}</span>}
    </div>
  );
};

export default NewsletterPanel;
