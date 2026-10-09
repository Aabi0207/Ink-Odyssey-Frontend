import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Archive, BookOpen, LayoutDashboard, LogOut, Menu, Sparkles, X } from "lucide-react";
import "./Navigation.css";

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sidebarRef = useRef(null);

  const isActive = (path) => {
    if (path === "/diary") {
      return location.pathname.startsWith("/diary") ? "nav-link active" : "nav-link";
    }
    return location.pathname === path ? "nav-link active" : "nav-link";
  };

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  // Handle scroll for transparency effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close when clicking outside sidebar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Keep the mobile menu usable with keyboard navigation and prevent background scrolling.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    if (menuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("mobile-menu-open");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("mobile-menu-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  return (
    <nav className={`main-navigation ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/diary" className="brand-link">
            <img src="/logo.png" alt="InkOdyssey logo" className="brand-logo" />
          </Link>
        </div>

        {/* Desktop menu */}
        <div className="nav-menu-desktop">
          <Link to="/diary" className={isActive("/diary")}>
            Diary
          </Link>
          <Link to="/reflection" className={isActive("/reflection")}>
            Reflection
          </Link>
          <Link to="/archive" className={isActive("/archive")}>
            Archive
          </Link>
          <Link to="/dashboard" className={isActive("/dashboard")}>
            Dashboard
          </Link>
          {user && (
            <button onClick={logout} className="logout-btn capsule">
              Logout
            </button>
          )}
        </div>

        {/* Three-dot menu for mobile */}
        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={23} strokeWidth={2.2} /> : <Menu size={24} strokeWidth={2.2} />}
        </button>

        <div
          className={`nav-backdrop ${menuOpen ? "open" : ""}`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        <div
          ref={sidebarRef}
          id="mobile-navigation"
          className={`nav-sidebar ${menuOpen ? "open" : ""}`}
          aria-hidden={!menuOpen}
        >
          <div className="mobile-menu-header">
            <span className="mobile-menu-kicker">Explore</span>
            <button className="mobile-close-btn" onClick={closeMenu} aria-label="Close navigation menu">
              <X size={20} />
            </button>
          </div>

          <div className="mobile-menu-links">
            <Link to="/diary" className={isActive("/diary")} onClick={closeMenu}>
              <BookOpen size={19} />
              <span>Diary</span>
            </Link>
            <Link to="/reflection" className={isActive("/reflection")} onClick={closeMenu}>
              <Sparkles size={19} />
              <span>Reflection</span>
            </Link>
            <Link to="/archive" className={isActive("/archive")} onClick={closeMenu}>
              <Archive size={19} />
              <span>Archive</span>
            </Link>
            <Link to="/dashboard" className={isActive("/dashboard")} onClick={closeMenu}>
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </Link>
          </div>

          {user && (
            <button
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="logout-btn capsule mobile-logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
