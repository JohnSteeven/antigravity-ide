import { useState } from "react";
import { Link } from "react-router-dom";
import { FiInstagram, FiLinkedin, FiMail, FiTwitter } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";

const Footer = () => {
  const { data, addSubscriber } = useCms();
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const socials = data.site.socials;
  const isAdmin = isAuthenticated && user?.role === "Admin";

  const handleSubmit = (event) => {
    event.preventDefault();
    addSubscriber(email);
    setMessage("You are subscribed.");
    setEmail("");
  };

  return (
    <>
      <section className="subscribe-section" id="newsletter">
        <div className="subscribe-content">
          <div className="subscribe-left">
            <FiMail className="mail-icon" />

            <h2>Stay Connected</h2>

            <p>
              Get occasional stories, reflections, and lessons directly in your
              inbox.
            </p>
          </div>

          <div className="subscribe-right">
            <form className="subscribe-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <button type="submit">Subscribe</button>
            </form>

            <span className="subscribe-note">
              {message || "No spam. Unsubscribe anytime."}
            </span>
          </div>
        </div>
      </section>

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
                <Link to="/#featured">Must Read</Link>
              </li>
              <li>
                <Link to="/#categories">Categories</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/search">Search</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/cms">CMS Dashboard</Link>
                </li>
              )}
            </ul>
          </div>

          <div className="footer-social">
            <h4>Let's Connect</h4>

            <div className="social-icons">
              <a href={socials.instagram} aria-label="Instagram">
                <FiInstagram />
              </a>

              <a href={socials.linkedin || "https://www.linkedin.com/in/noblejohnsteeven/"} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
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
