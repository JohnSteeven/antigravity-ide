import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiSearch,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiGrid,
  FiBookmark,
  FiSettings,
  FiBookOpen,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";
import { categoryApi } from "../services/apiService";
import PublicSearchModal from "./shared/PublicSearchModal";

const Header = () => {
  const { data } = useCms();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation state
  const [categories, setCategories] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileCatExpanded, setIsMobileCatExpanded] = useState(false);

  const categoriesDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const isAdmin = isAuthenticated && (user?.role === "Admin" || user?.role === "Editor");

  // Fetch public categories directly from public category API
  const fetchPublicCategories = async () => {
    try {
      const res = await categoryApi.list({ isActive: true, status: "published" });
      const rawCategories = res?.categories || [];

      // Enforce strict public lifecycle filtering
      const filtered = rawCategories
        .filter(
          (c) =>
            c.isActive !== false &&
            (c.status || "published") === "published" &&
            (c.visibility || "public") === "public" &&
            c.showInNavigation !== false &&
            !c.isDeleted
        )
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      setCategories(filtered);
    } catch (err) {
      console.warn("Could not fetch public categories from API", err);
    }
  };

  useEffect(() => {
    fetchPublicCategories();
  }, [data?.categories]);

  // Combined public categories fallback (if API call is pending, filter context categories)
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;

    if (Array.isArray(data?.categories)) {
      return data.categories
        .filter(
          (c) =>
            c.isActive !== false &&
            (c.status || "published") === "published" &&
            (c.visibility || "public") === "public" &&
            c.showInNavigation !== false &&
            !c.isDeleted
        )
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }

    return [];
  }, [categories, data?.categories]);

  // Close menus on location change
  useEffect(() => {
    setIsCategoriesOpen(false);
    setIsAccountOpen(false);
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Global click-outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(e.target)
      ) {
        setIsCategoriesOpen(false);
      }
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target)
      ) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsCategoriesOpen(false);
        setIsAccountOpen(false);
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    await logout();
    setIsAccountOpen(false);
    setIsMobileOpen(false);
    navigate("/", { replace: true });
  };

  const isCategoryActive = location.pathname.startsWith("/category");

  return (
    <>
      <header className="header main-public-header">
        <div className="header-inner container">
          {/* Brand Logo */}
          <Link className="logo" to="/" onClick={() => setIsMobileOpen(false)}>
            <h1>{data?.site?.brand || "MyJourney"}</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <ul className="nav-links">
              <li>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Home
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/articles"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Articles
                </NavLink>
              </li>

              {/* Categories Dropdown */}
              <li className="nav-dropdown-wrapper" ref={categoriesDropdownRef}>
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${
                    isCategoryActive || isCategoriesOpen ? "active" : ""
                  }`}
                  onClick={() => setIsCategoriesOpen((prev) => !prev)}
                  aria-expanded={isCategoriesOpen}
                  aria-haspopup="true"
                  aria-controls="categories-menu"
                >
                  <span>Categories</span>
                  <FiChevronDown
                    className={`dropdown-chevron ${
                      isCategoriesOpen ? "open" : ""
                    }`}
                  />
                </button>

                {isCategoriesOpen && (
                  <ul className="nav-dropdown-menu" id="categories-menu" role="menu">
                    {displayCategories.length > 0 ? (
                      displayCategories.map((cat) => (
                        <li key={cat.id || cat._id || cat.slug} role="none">
                          <Link
                            to={`/category/${cat.slug}`}
                            className="dropdown-item"
                            role="menuitem"
                            onClick={() => setIsCategoriesOpen(false)}
                          >
                            <span className="dropdown-item-title">{cat.name}</span>
                            {cat.description && (
                              <span className="dropdown-item-desc">
                                {cat.description}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="dropdown-empty" role="none">
                        No active categories
                      </li>
                    )}
                  </ul>
                )}
              </li>

              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    isActive ||
                    location.pathname === "/read-my-story" ||
                    location.pathname === "/readmystory"
                      ? "active"
                      : ""
                  }
                >
                  About
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/contact"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Right Header Actions: Search & Account */}
          <div className="header-actions">
            {/* Search Trigger Button */}
            <button
              type="button"
              className="header-action-btn search-trigger-btn"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search modal"
            >
              <FiSearch />
              <span className="desktop-only-text">Search</span>
            </button>

            {/* Account Menu / Sign In */}
            {isAuthenticated ? (
              <div className="nav-dropdown-wrapper" ref={accountDropdownRef}>
                <button
                  type="button"
                  className={`header-action-btn account-trigger-btn ${
                    isAccountOpen ? "active" : ""
                  }`}
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  aria-expanded={isAccountOpen}
                  aria-haspopup="true"
                  aria-controls="account-menu"
                >
                  <FiUser className="account-avatar-icon" />
                  <span className="desktop-only-text">
                    {user?.name ? user.name.split(" ")[0] : "Account"}
                  </span>
                  <FiChevronDown
                    className={`dropdown-chevron ${
                      isAccountOpen ? "open" : ""
                    }`}
                  />
                </button>

                {isAccountOpen && (
                  <ul className="nav-dropdown-menu account-dropdown-menu" id="account-menu" role="menu">
                    <li className="account-menu-header" role="none">
                      <div className="user-name">{user?.name || "Reader"}</div>
                      <div className="user-email">{user?.email}</div>
                    </li>

                    {isAdmin && (
                      <li role="none">
                        <Link
                          to="/cms"
                          className="dropdown-item cms-link-item"
                          role="menuitem"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <FiGrid /> CMS Dashboard
                        </Link>
                      </li>
                    )}

                    <li role="none">
                      <Link
                        to="/profile/dashboard"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiBookOpen /> Reader Dashboard
                      </Link>
                    </li>

                    <li role="none">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiBookmark /> Saved / Bookmarks
                      </Link>
                    </li>

                    <li role="none">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiUser /> Profile
                      </Link>
                    </li>

                    <li role="none">
                      <Link
                        to="/edit-profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiSettings /> Settings
                      </Link>
                    </li>

                    <li className="dropdown-divider" role="none" />

                    <li role="none">
                      <button
                        type="button"
                        className="dropdown-item logout-item"
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <FiLogOut /> Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="btn-sign-in">
                <FiLogIn /> Sign In
              </NavLink>
            )}

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open mobile navigation drawer"
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <PublicSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mobile Drawer & Backdrop */}
      {isMobileOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        >
          <aside
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className="mobile-drawer-header">
              <Link
                className="logo"
                to="/"
                onClick={() => setIsMobileOpen(false)}
              >
                <h2>{data?.site?.brand || "MyJourney"}</h2>
              </Link>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close mobile menu"
              >
                <FiX />
              </button>
            </div>

            <div className="mobile-drawer-body">
              <button
                type="button"
                className="mobile-search-btn"
                onClick={() => {
                  setIsMobileOpen(false);
                  setIsSearchOpen(true);
                }}
              >
                <FiSearch /> Search articles & topics...
              </button>

              <nav className="mobile-drawer-nav">
                <ul>
                  <li>
                    <NavLink
                      to="/"
                      end
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Home
                    </NavLink>
                  </li>

                  <li>
                    <NavLink
                      to="/articles"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Articles
                    </NavLink>
                  </li>

                  {/* Mobile Categories Collapsible */}
                  <li className="mobile-cat-accordion">
                    <button
                      type="button"
                      className="mobile-accordion-trigger"
                      onClick={() => setIsMobileCatExpanded((prev) => !prev)}
                      aria-expanded={isMobileCatExpanded}
                    >
                      <span>Categories</span>
                      <FiChevronDown
                        className={`dropdown-chevron ${
                          isMobileCatExpanded ? "open" : ""
                        }`}
                      />
                    </button>

                    {isMobileCatExpanded && (
                      <ul className="mobile-sub-list">
                        {displayCategories.map((cat) => (
                          <li key={cat.id || cat._id || cat.slug}>
                            <Link
                              to={`/category/${cat.slug}`}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              {cat.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>

                  <li>
                    <NavLink
                      to="/about"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      About
                    </NavLink>
                  </li>

                  <li>
                    <NavLink
                      to="/contact"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Contact
                    </NavLink>
                  </li>
                </ul>
              </nav>

              {/* Mobile Account Section */}
              <div className="mobile-drawer-account">
                {isAuthenticated ? (
                  <div className="mobile-account-group">
                    <div className="mobile-user-card">
                      <FiUser />
                      <div>
                        <div className="mobile-user-name">
                          {user?.name || "Reader"}
                        </div>
                        <div className="mobile-user-email">{user?.email}</div>
                      </div>
                    </div>

                    <div className="mobile-account-links">
                      {isAdmin && (
                        <Link
                          to="/cms"
                          className="mobile-account-link cms-link"
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <FiGrid /> CMS Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile/dashboard"
                        className="mobile-account-link"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <FiBookOpen /> Reader Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="mobile-account-link"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <FiBookmark /> Saved / Bookmarks
                      </Link>
                      <Link
                        to="/edit-profile"
                        className="mobile-account-link"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <FiSettings /> Settings
                      </Link>
                      <button
                        type="button"
                        className="mobile-logout-btn"
                        onClick={handleLogout}
                      >
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="mobile-sign-in-btn"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <FiLogIn /> Sign In to MyJourney
                  </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Header;
