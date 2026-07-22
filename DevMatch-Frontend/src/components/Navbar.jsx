import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationsDropdown from "./NotificationsDropdown";
import { useState, useRef, useEffect } from "react";
import { FaBell, FaChevronDown, FaUser, FaFolderOpen, FaPlus, FaSignOutAlt, FaEdit } from "react-icons/fa";
import { API_URL } from "../config";

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Auto-fetch notification count on mount, then poll every 8s so the bell
  // updates even if the dropdown was never manually opened (fixes stale count bug)
  useEffect(() => {
    if (!user) return;

    const fetchCount = () => {
      fetch(`${API_URL}/projects/notifications`, { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setNotifCount(data.length); })
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Poll unread chat count so the Chats nav link shows a live badge
  // even while the user is elsewhere in the app
  useEffect(() => {
    if (!user) return;

    const fetchUnread = () => {
      fetch(`${API_URL}/chat/unread-count`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setUnreadChats(data.unread_rooms || 0); })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);
    return () => clearInterval(interval);
  }, [user, location.pathname]); // re-check on navigation too — clears instantly after visiting a chat

  // Allow other components (e.g. Dashboard "Notifications" stat card) to open
  // the bell dropdown programmatically via a custom window event
  useEffect(() => {
    const openHandler = () => { setShowNotifications(true); setShowUserMenu(false); };
    window.addEventListener("devmatch:open-notifications", openHandler);
    return () => window.removeEventListener("devmatch:open-notifications", openHandler);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const AVATAR_COLORS = ["#2952A3","#4B6FCE","#0EA5E9","#10B981","#F59E0B","#EF4444"];
  const avatarColor = AVATAR_COLORS[(user?.id || 0) % AVATAR_COLORS.length];
  const avatarLetter = (user?.user_name || user?.username || "?").charAt(0).toUpperCase();

  const navLinks = [
    { to: "/projects",  label: "Projects"  },
    { to: "/matches",   label: "🎯 Matches" },
    { to: "/profiles",  label: "Profiles"  },
    { to: "/chats",     label: "💬 Chats"   },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: "#fff",
      borderBottom: "1px solid #D0DAEE",
      boxShadow: "0 1px 8px rgba(41,82,163,0.08)",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px",
        height: 60,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}>

        {/* ── Logo ── */}
        <Link to={user ? "/dashboard" : "/login"} style={{ textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#1E2B4A" }}>
            Dev<span style={{ color: "#2952A3" }}>Match</span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        {user && (
          <div className="d-none d-lg-flex align-items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to} to={to}
                style={{
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: "0.88rem",
                  fontWeight: isActive(to) ? 700 : 500,
                  color: isActive(to) ? "#2952A3" : "#5E6E9A",
                  background: isActive(to) ? "#EEF2FB" : "transparent",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!isActive(to)) { e.currentTarget.style.background = "#F2F5FC"; e.currentTarget.style.color = "#2952A3"; }}}
                onMouseLeave={(e) => { if (!isActive(to)) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5E6E9A"; }}}
              >
                {label}
                {to === "/chats" && unreadChats > 0 && (
                  <span style={{
                    position: "absolute", top: 2, right: 2,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#DC2626", border: "1.5px solid #fff",
                  }} />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right side ── */}
        <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
          {user ? (
            <>
              {/* Create Project button */}
              <Link
                to="/create-project"
                className="d-none d-md-flex align-items-center gap-1"
                style={{
                  textDecoration: "none",
                  background: "#2952A3", color: "#fff",
                  borderRadius: 8, padding: "6px 14px",
                  fontSize: "0.82rem", fontWeight: 600,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1E3D7A")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2952A3")}
              >
                <FaPlus size={10} /> New Project
              </Link>

              {/* Bell notification */}
              <div ref={notifRef} style={{ position: "relative" }}>
                <button
                  onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "6px", borderRadius: 8, position: "relative",
                    color: showNotifications ? "#2952A3" : "#7A8BB0",
                    transition: "color 0.15s",
                  }}
                >
                  <FaBell size={18} color={notifCount > 0 ? "#2952A3" : "#bbb"} />
                  {notifCount > 0 && (
                    <span style={{
                      position: "absolute", top: 2, right: 2,
                      background: "#2952A3", color: "#fff",
                      borderRadius: "50%", width: 16, height: 16,
                      fontSize: "0.6rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fff",
                    }}>
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 300 }}>
                    <NotificationsDropdown setNotifCount={setNotifCount} />
                  </div>
                )}
              </div>

              {/* User avatar + dropdown */}
              <div ref={userMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 7, padding: "4px 6px", borderRadius: 8,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: avatarColor, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "0.85rem",
                  }}>
                    {avatarLetter}
                  </div>
                  <FaChevronDown size={10} color="#8B9CC2" style={{ transform: showUserMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {showUserMenu && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    background: "#fff", borderRadius: 12, minWidth: 200,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    border: "1px solid #D0DAEE", overflow: "hidden", zIndex: 300,
                  }}>
                    {/* User info header */}
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #F2F5FC" }}>
                      <div style={{ fontWeight: 700, color: "#1E2B4A", fontSize: "0.9rem" }}>
                        {user.first_name || user.user_name}
                      </div>
                      <div style={{ color: "#8A9BBC", fontSize: "0.75rem" }}>@{user.user_name}</div>
                    </div>

                    {/* Menu items */}
                    {[
                      { icon: <FaUser size={12} />, label: "My Profile",    to: `/profile/${user.id}` },
                      { icon: <FaEdit size={12} />, label: "Edit Profile",  to: "/edit-profile" },
                      { icon: <FaFolderOpen size={12} />, label: "My Projects", to: "/owner/projects" },
                    ].map(({ icon, label, to }) => (
                      <Link
                        key={to} to={to}
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 16px", textDecoration: "none",
                          color: "#444", fontSize: "0.85rem",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FB")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ color: "#2952A3" }}>{icon}</span> {label}
                      </Link>
                    ))}

                    <div style={{ borderTop: "1px solid #F2F5FC", margin: "4px 0" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 16px", width: "100%",
                        background: "none", border: "none",
                        color: "#e53e3e", fontSize: "0.85rem",
                        cursor: "pointer", transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <FaSignOutAlt size={12} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="d-lg-none"
                onClick={() => setMobileOpen((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}
              >
                <div style={{ width: 20, height: 2, background: "#5E6E9A", marginBottom: 4, transition: "all 0.2s", transform: mobileOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
                <div style={{ width: 20, height: 2, background: "#5E6E9A", marginBottom: 4, opacity: mobileOpen ? 0 : 1, transition: "opacity 0.2s" }} />
                <div style={{ width: 20, height: 2, background: "#5E6E9A", transition: "all 0.2s", transform: mobileOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
              </button>
            </>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" style={{ textDecoration: "none", padding: "7px 16px", border: "1.5px solid #2952A3", borderRadius: 8, color: "#2952A3", fontSize: "0.85rem", fontWeight: 600 }}>
                Sign In
              </Link>
              <Link to="/register" style={{ textDecoration: "none", padding: "7px 16px", background: "#2952A3", borderRadius: 8, color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div style={{
          background: "#fff", borderTop: "1px solid #D0DAEE",
          padding: "12px 20px 16px",
        }}>
          {navLinks.map(({ to, label }) => (
            <Link
              key={to} to={to}
              style={{
                display: "block", padding: "10px 0",
                textDecoration: "none",
                color: isActive(to) ? "#2952A3" : "#5E6E9A",
                fontWeight: isActive(to) ? 700 : 500,
                fontSize: "0.9rem",
                borderBottom: "1px solid #EEF2FB",
                position: "relative",
              }}
            >
              {label}
              {to === "/chats" && unreadChats > 0 && (
                <span style={{
                  display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                  background: "#DC2626", marginLeft: 6, verticalAlign: "middle",
                }} />
              )}
            </Link>
          ))}
          <Link to="/create-project" style={{ display: "block", padding: "10px 0", textDecoration: "none", color: "#2952A3", fontWeight: 600, fontSize: "0.9rem" }}>
            + New Project
          </Link>
        </div>
      )}
    </nav>
  );
}
