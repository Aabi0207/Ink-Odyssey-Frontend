import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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

  const toggleMenu = () => setMenuOpen(!menuOpen);

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

  return (
    <nav className={`main-navigation ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className={`nav-brand ${location.pathname.startsWith("/diary") ? "hidden" : ""}`}>
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
          aria-label="Toggle menu"
        >
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </button>

        {/* Sidebar for mobile */}
        <div
          ref={sidebarRef}
          className={`nav-sidebar ${menuOpen ? "open" : ""}`}
        >
          <Link to="/diary" className={isActive("/diary")} onClick={toggleMenu}>
            Diary
          </Link>
          <Link
            to="/reflection"
            className={isActive("/reflection")}
            onClick={toggleMenu}
          >
            Reflection
          </Link>
          <Link
            to="/dashboard"
            className={isActive("/dashboard")}
            onClick={toggleMenu}
          >
            Dashboard
          </Link>

          {user && (
            <button
              onClick={() => {
                logout();
                toggleMenu();
              }}
              className="logout-btn capsule"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
