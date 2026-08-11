import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiLogIn,
  FiGrid,
  FiBookmark,
  FiSettings,
  FiBookOpen,
  FiMenu,
  FiX,
  FiShield,
  FiCompass,
  FiArrowRight,
} from "react-icons/fi";
import { useCms } from "../context/CmsContext";
import { useAuth } from "../hooks/useAuth";
import { categoryApi } from "../services/apiService";

const Header = () => {
  const { data } = useCms();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation state
  const [categories, setCategories] = useState([]);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileCatExpanded, setIsMobileCatExpanded] = useState(false);

  const categoriesDropdownRef = useRef(null);
  const accountDropdownRef = useRef(null);

  const isAdmin = isAuthenticated && (user?.role === "Admin" || user?.role === "Editor");

  const avatarUrl = useMemo(() => {
    const raw =
      user?.avatar ||
      user?.profile?.avatar ||
      user?.photoURL ||
      user?.profileImage ||
      "";
    return typeof raw === "string" && raw.trim() && !raw.includes("placeholder")
      ? raw.trim()
      : "";
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return "User";
    if (user.name && user.name.trim()) return user.name.trim();
    if (user.displayName && user.displayName.trim()) return user.displayName.trim();
    if (user.firstName && user.firstName.trim()) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    if (user.username && user.username.trim()) return user.username.trim();
    return "User";
  }, [user]);

  const username = useMemo(() => {
    return user?.username ? user.username.replace(/^@/, "").trim() : "";
  }, [user]);

  const initials = useMemo(() => {
    if (!user) return "U";
    const nameStr = displayName !== "User" ? displayName : (username || "User");
    const parts = nameStr.replace(/^@/, "").split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0][0].toUpperCase();
    }
    return "U";
  }, [user, displayName, username]);

  const email = user?.email || "";

  // Fetch public categories directly from public category API
  const fetchPublicCategories = async () => {
    try {
      const res = await categoryApi.list({ isActive: true });
      const rawCategories = res?.categories || [];

      // Filter active non-deleted categories
      const active = rawCategories.filter(
        (c) =>
          c.isActive !== false &&
          !c.isDeleted &&
          (c.status === undefined || c.status === "published") &&
          (c.visibility === undefined || c.visibility === "public")
      );

      setCategories(active);
    } catch (err) {
      console.warn("Could not fetch public categories from API", err);
    }
  };

  useEffect(() => {
    fetchPublicCategories();
  }, [data?.categories]);

  // Featured Categories logic (selects top 8 categories data-driven)
  const featuredCategories = useMemo(() => {
    const raw = categories.length > 0 ? categories : (data?.categories || []);
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const active = raw.filter(
      (c) =>
        c.isActive !== false &&
        !c.isDeleted &&
        (c.status === undefined || c.status === "published") &&
        (c.visibility === undefined || c.visibility === "public")
    );

    const coreSlugs = ["life", "reflections", "incidents", "experiences", "lessons", "travel", "news", "coding"];

    const sorted = [...active].sort((a, b) => {
      const featA = a.isFeatured || a.featured || a.showInNavigation ? 1 : 0;
      const featB = b.isFeatured || b.featured || b.showInNavigation ? 1 : 0;
      if (featA !== featB) return featB - featA;

      const orderA = a.navigationPriority ?? a.displayOrder ?? a.sortOrder ?? a.order;
      const orderB = b.navigationPriority ?? b.displayOrder ?? b.sortOrder ?? b.order;
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;

      const indexA = coreSlugs.indexOf((a.slug || "").toLowerCase());
      const indexB = coreSlugs.indexOf((b.slug || "").toLowerCase());
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return (a.name || "").localeCompare(b.name || "");
    });

    return sorted.slice(0, 8);
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

              <li>
                <NavLink
                  to="/stories"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  Stories
                </NavLink>
              </li>

              {isAuthenticated && (
                <li>
                  <NavLink
                    to="/life/today"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    Life
                  </NavLink>
                </li>
              )}

              {/* Categories Dropdown */}
              <li className="nav-dropdown-wrapper" ref={categoriesDropdownRef}>
                <button
                  type="button"
                  className={`nav-dropdown-trigger ${isCategoryActive || isCategoriesOpen ? "active" : ""
                    }`}
                  onClick={() => setIsCategoriesOpen((prev) => !prev)}
                  aria-expanded={isCategoriesOpen}
                  aria-haspopup="true"
                  aria-controls="categories-menu"
                >
                  <span>Categories</span>
                  <FiChevronDown
                    className={`dropdown-chevron ${isCategoriesOpen ? "open" : ""
                      }`}
                  />
                </button>

                {isCategoriesOpen && (
                  <div
                    className="nav-dropdown-menu categories-mega-menu"
                    id="categories-menu"
                    role="menu"
                  >
                    <div className="mega-menu-header">
                      <span className="mega-menu-title">Explore MyJourney</span>
                      <span className="mega-menu-subtitle">
                        Choose a topic to dive into meaningful content
                      </span>
                    </div>

                    <div className="mega-menu-grid">
                      {featuredCategories.length > 0 ? (
                        featuredCategories.map((cat) => {
                          const shortDesc =
                            cat.shortDescription || cat.description || "Articles and insights";
                          const displayName = cat.name === "Incidents" ? "Experiences" : cat.name;
                          return (
                            <Link
                              key={cat.id || cat._id || cat.slug}
                              to={`/category/${cat.slug}`}
                              className="mega-menu-item"
                              role="menuitem"
                              onClick={() => setIsCategoriesOpen(false)}
                            >
                              <div className="mega-menu-item-icon">
                                <FiCompass />
                              </div>
                              <div className="mega-menu-item-content">
                                <span className="mega-menu-item-title">{displayName}</span>
                                <span className="mega-menu-item-desc">{shortDesc}</span>
                              </div>
                            </Link>
                          );
                        })
                      ) : (
                        <div className="dropdown-empty" role="none">
                          No categories available
                        </div>
                      )}
                    </div>

                    <div className="mega-menu-footer">
                      <Link
                        to="/categories"
                        className="mega-menu-all-link"
                        onClick={() => setIsCategoriesOpen(false)}
                      >
                        <span>View All Categories</span>
                        <FiArrowRight />
                      </Link>
                    </div>
                  </div>
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

          {/* Right Header Actions: Account & Mobile Navigation */}
          <div className="header-actions">
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
                  <div className="header-avatar-circle">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="header-avatar-img" />
                    ) : (
                      <span className="header-avatar-initials">{initials}</span>
                    )}
                  </div>

                  <span className="header-user-name">{displayName}</span>

                  <FiChevronDown
                    className={`dropdown-chevron ${
                      isAccountOpen ? "open" : ""
                    }`}
                  />
                </button>

                {isAccountOpen && (
                  <ul className="nav-dropdown-menu account-dropdown-menu" id="account-menu" role="menu">
                    <li className="account-menu-header" role="none">
                      <div className="account-profile-card">
                        <div className="dropdown-avatar-circle">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="dropdown-avatar-img" />
                          ) : (
                            <span className="dropdown-avatar-initials">{initials}</span>
                          )}
                        </div>

                        <div className="dropdown-user-info">
                          <div className="dropdown-display-name">{displayName}</div>
                          {username && <div className="dropdown-username">@{username}</div>}
                          {email && <div className="dropdown-email">{email}</div>}

                          {isAdmin ? (
                            <div className="dropdown-role-tag admin">
                              <FiShield className="role-shield-icon" /> Administrator
                            </div>
                          ) : (
                            <div className="dropdown-role-tag reader">
                              Reader
                            </div>
                          )}
                        </div>
                      </div>
                    </li>

                    <li className="dropdown-divider" role="none" />

                    <li role="none">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiUser className="dropdown-item-icon" />
                        <span className="dropdown-item-label">My Profile</span>
                      </Link>
                    </li>

                    <li role="none">
                      <Link
                        to="/profile/dashboard"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiBookOpen className="dropdown-item-icon" />
                        <span className="dropdown-item-label">Reader Dashboard</span>
                      </Link>
                    </li>

                    {isAdmin && (
                      <li role="none">
                        <Link
                          to="/cms"
                          className="dropdown-item cms-link-item"
                          role="menuitem"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <FiGrid className="dropdown-item-icon" />
                          <span className="dropdown-item-label">Admin Dashboard</span>
                        </Link>
                      </li>
                    )}

                    <li role="none">
                      <Link
                        to="/edit-profile"
                        className="dropdown-item"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        <FiSettings className="dropdown-item-icon" />
                        <span className="dropdown-item-label">Settings</span>
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
                        <FiLogOut className="dropdown-item-icon" />
                        <span className="dropdown-item-label">Sign Out</span>
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

                  <li>
                    <NavLink
                      to="/stories"
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Stories
                    </NavLink>
                  </li>

                  {isAuthenticated && (
                    <li>
                      <NavLink
                        to="/life/today"
                        onClick={() => setIsMobileOpen(false)}
                      >
                        Life
                      </NavLink>
                    </li>
                  )}

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
                        className={`dropdown-chevron ${isMobileCatExpanded ? "open" : ""
                          }`}
                      />
                    </button>

                    {isMobileCatExpanded && (
                      <ul className="mobile-sub-list">
                        {featuredCategories.map((cat) => (
                          <li key={cat.id || cat._id || cat.slug}>
                            <Link
                              to={`/category/${cat.slug}`}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              {cat.name === "Incidents" ? "Experiences" : cat.name}
                            </Link>
                          </li>
                        ))}
                        <li className="mobile-more-cat-item">
                          <Link
                            to="/categories"
                            className="mobile-more-cat-link"
                            onClick={() => setIsMobileOpen(false)}
                          >
                            <span>More Categories →</span>
                          </Link>
                        </li>
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
