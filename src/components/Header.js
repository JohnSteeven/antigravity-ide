import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiLogIn, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";

const Header = () => {
  const { data } = useCms();
  const { isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const sectionLinks = [
    { id: "featured", label: "Must Read" },
    { id: "categories", label: "Categories" },
  ];

  const scrollToSection = (sectionId) => {
    setIsOpen(false);
    const hash = `#${sectionId}`;

    const runScroll = () => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    if (location.pathname !== "/" || location.hash !== hash) {
      navigate({ pathname: "/", hash });
      window.setTimeout(runScroll, 80);
      return;
    }

    runScroll();
  };

  const isSectionActive = (sectionId) =>
    location.pathname === "/" && location.hash === `#${sectionId}`;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <header className="header">
      <Link className="logo" to="/" onClick={() => setIsOpen(false)}>
        <h1>{data.site.brand}</h1>
      </Link>

      <button
        className="mobile-menu-btn"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Toggle navigation"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      <nav className={isOpen ? "open" : ""}>
        <ul className="nav-links">
          <li>
            <NavLink
              to="/"
              end
              className={() => (location.pathname === "/" && !location.hash ? "active" : "")}
              onClick={() => setIsOpen(false)}
            >
              Home
            </NavLink>
          </li>
          {sectionLinks.map((item) => (
            <li key={item.id}>
              <button
                className={isSectionActive(item.id) ? "active" : ""}
                type="button"
                onClick={() => scrollToSection(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive || location.pathname === "/read-my-story" || location.pathname === "/readmystory" ? "active" : ""
              }
              onClick={() => setIsOpen(false)}
            >
              About
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/contact"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setIsOpen(false)}
            >
              Contact
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" onClick={() => setIsOpen(false)}>
              Profile
            </NavLink>
          </li>
          {isAuthenticated ? (
            <li>
              <button className="logout-nav-btn" type="button" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </li>
          ) : (
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => setIsOpen(false)}
              >
                <FiLogIn /> Login
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
