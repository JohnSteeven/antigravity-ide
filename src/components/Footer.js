import { useState } from "react";
import { Link } from "react-router";
import {
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiTwitter,
  FiCheck,
  FiSend,
  FiCheckCircle,
  FiExternalLink,
  FiRotateCcw,
  FiShield,
  FiUsers,
  FiStar,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";

const Footer = () => {
  const { data, addSubscriber } = useCms();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const socials = data.site.socials;
  const isAdmin = isAuthenticated && user?.role === "Admin";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      if (addSubscriber) {
        await addSubscriber(trimmedEmail);
      }
      setSubmittedEmail(trimmedEmail);
      setIsSubmitted(true);
      setEmail("");
    } catch (err) {
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setIsSubmitted(false);
    setEmail("");
    setMessage("");
    setSubmittedEmail("");
  };

  return (
    <>
      <section className="subscribe-section" id="newsletter" aria-labelledby="newsletter-heading">
        <div className="subscribe-container">
          {/* Left Column: Brand & Value Proposition */}
          <div className="subscribe-left">
            <div className="subscribe-kicker">
              <FiMail className="kicker-icon" />
              <span>NEWSLETTER</span>
            </div>

            <h2 id="newsletter-heading" className="subscribe-title">
              Stay Connected
            </h2>

            <p className="subscribe-description">
              Receive inspiring stories, life lessons, productivity tips, exclusive articles, and monthly insights directly in your inbox.
            </p>

            <div className="subscribe-features">
              <div className="feature-badge">
                <FiCheck className="feature-icon" />
                <span>Weekly Digest</span>
              </div>
              <div className="feature-badge">
                <FiCheck className="feature-icon" />
                <span>Exclusive Articles</span>
              </div>
              <div className="feature-badge">
                <FiCheck className="feature-icon" />
                <span>No Spam Ever</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Form Card / Success Card */}
          <div className="subscribe-right">
            <div className="subscribe-card">
              {!isSubmitted ? (
                <form className="subscribe-form" onSubmit={handleSubmit} aria-label="Newsletter Subscription Form" noValidate>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (message) setMessage("");
                      }}
                      required
                      disabled={isSubmitting}
                      aria-label="Your email address"
                      aria-required="true"
                      aria-invalid={Boolean(message && !isSubmitted)}
                      className="subscribe-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="subscribe-btn"
                    aria-label="Subscribe to newsletter"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-icon" aria-hidden="true"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <FiSend className="btn-send-icon" />
                      </>
                    )}
                  </button>

                  {message && (
                    <div className="subscribe-error-alert" role="alert">
                      {message}
                    </div>
                  )}

                  <p className="subscribe-privacy-note">
                    <FiShield className="privacy-icon" />
                    <span>We respect your privacy. Unsubscribe anytime.</span>
                  </p>

                  <div className="subscribe-trust-bar">
                    <div className="trust-item">
                      <FiUsers className="trust-icon" />
                      <span>10,000+ Readers</span>
                    </div>
                    <span className="trust-divider">•</span>
                    <div className="trust-item">
                      <FiStar className="trust-icon" />
                      <span>Free Forever</span>
                    </div>
                    <span className="trust-divider">•</span>
                    <div className="trust-item">
                      <FiCheck className="trust-icon" />
                      <span>No Spam</span>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="subscribe-success-card" role="status" aria-live="polite">
                  <div className="success-icon-wrapper">
                    <FiCheckCircle className="success-animated-icon" />
                  </div>

                  <h3 className="success-title">Check your inbox</h3>

                  <p className="success-description">
                    We've sent a verification email to <strong>{submittedEmail}</strong>.
                    Please verify your email to start receiving MyJourney newsletters.
                  </p>

                  <div className="success-actions">
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-mail"
                    >
                      <span>Open Email App</span>
                      <FiExternalLink />
                    </a>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="btn-subscribe-another"
                    >
                      <FiRotateCcw />
                      <span>Subscribe another email</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Site Footer */}
      <footer className="footer" id="contact">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{data.site.brand}</h3>
            <p>{data.site.footer}</p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/articles">Articles</Link>
              </li>
              <li>
                <Link to="/#categories">Categories</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div className="footer-social">
            <h4>Let's Connect</h4>
            <div className="social-icons">
              <a
                href={socials.instagram || "https://www.instagram.com/j.steeven_?utm_source=qr&igsh=MWh6aHFyNmIxZTV6Mg%3D%3D"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FiInstagram />
              </a>

              <a
                href={socials.linkedin || "https://www.linkedin.com/in/noblejohnsteeven/"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FiLinkedin />
              </a>

              <a href={socials.twitter} aria-label="Twitter">
                <FiTwitter />
              </a>

              <a href={socials.email} aria-label="Email">
                <FiMail />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; 2026 {data.site.brand}. All rights reserved.
        </div>
      </footer>
    </>
  );
};

export default Footer;
