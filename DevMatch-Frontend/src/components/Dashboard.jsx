import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaRocket,
  FaSearch,
  FaComments,
  FaUserEdit,
  FaPlus,
  FaFolderOpen,
  FaClock,
  FaBell,
  FaFire,
} from "react-icons/fa";

const BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: "80px 80px",
  minHeight: "100vh",
  padding: "40px 20px",
};

const AVATAR_COLORS = [
  "#2952A3",
  "#4B6FCE",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

function StatCard({
  icon,
  value,
  label,
  color,
  path,
  navigate,
  highlight,
  onClick,
}) {
  const handleClick = () => {
    if (onClick) onClick();
    else if (path) navigate(path);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
          : "#fff",
        borderRadius: 14,
        padding: "20px",
        boxShadow: highlight
          ? `0 4px 20px ${color}40`
          : "0 2px 12px rgba(0,0,0,0.07)",
        cursor: path || onClick ? "pointer" : "default",
        border: highlight ? "none" : "1px solid #D0DAEE",
        transition: "transform 0.15s, box-shadow 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
      onMouseEnter={(e) => {
        if (path || onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = highlight
            ? `0 8px 24px ${color}50`
            : "0 6px 20px rgba(0,0,0,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = highlight
          ? `0 4px 20px ${color}40`
          : "0 2px 12px rgba(0,0,0,0.07)";
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: highlight ? "rgba(255,255,255,0.2)" : color + "18",
          color: highlight ? "#fff" : color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1rem",
          marginBottom: 4,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: "1.6rem",
          lineHeight: 1,
          color: highlight ? "#fff" : "#1E2B4A",
        }}
      >
        {value ?? "—"}
      </div>
      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 500,
          color: highlight ? "rgba(255,255,255,0.85)" : "#7A8BB0",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const toastShown = useRef(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && !user.is_profile_completed && !toastShown.current) {
      toast.warning("Complete your profile to start matching with projects!");
      toastShown.current = true;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetch("http://localhost:5000/auth/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user]);

  if (loading)
    return (
      <div
        style={{
          ...BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner-border" style={{ color: "#2952A3" }} />
      </div>
    );

  if (!user) return null;

  const avatarColor = AVATAR_COLORS[(user.id || 0) % AVATAR_COLORS.length];
  const displayName = user.first_name || user.user_name;

  const statCards = [
    {
      icon: <FaFolderOpen />,
      value: stats?.projects_owned,
      label: "Projects Created",
      color: "#2952A3",
      path: "/owner/projects",
      highlight: true,
    },
    {
      icon: <FaRocket />,
      value: stats?.projects_joined,
      label: "Projects Joined",
      color: "#4338CA",
      path: "/owner/projects?tab=joined",
    },
    {
      icon: <FaClock />,
      value: stats?.pending_requests,
      label: "Pending Requests",
      color: "#D97706",
      path: "/owner/projects?tab=requests",
    },
    {
      icon: <FaComments />,
      value: stats?.active_chats,
      label: "Active Chats",
      color: "#059669",
      path: "/chats",
    },
    {
      icon: <FaBell />,
      value: stats?.unread_notifications,
      label: "Notifications",
      color: "#0EA5E9",
      onClick: () =>
        window.dispatchEvent(new Event("devmatch:open-notifications")),
    },
  ];

  const quickActions = [
    {
      icon: <FaSearch />,
      label: "Browse Projects",
      desc: "Find projects to join",
      path: "/projects",
      color: "#4B6FCE",
    },
    {
      icon: <FaFire />,
      label: "Find Matches",
      desc: "Projects that fit your skills",
      path: "/matches",
      color: "#2952A3",
    },
    {
      icon: <FaPlus />,
      label: "Create Project",
      desc: "Start a new project",
      path: "/create-project",
      color: "#0EA5E9",
    },
    {
      icon: <FaComments />,
      label: "My Chats",
      desc: "View team conversations",
      path: "/chats",
      color: "#10B981",
    },
    {
      icon: <FaUserEdit />,
      label: "Edit Profile",
      desc: "Update your info & skills",
      path: "/edit-profile",
      color: "#F59E0B",
    },
  ];

  return (
    <div style={BG}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Welcome card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(41,82,163,0.08)",
            padding: "28px 32px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: avatarColor,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: `0 4px 16px ${avatarColor}55`,
            }}
          >
            {displayName?.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 800, color: "#1E2B4A", marginBottom: 4 }}>
              Welcome back, {displayName}! 👋
            </h3>
            <p
              style={{ color: "#8A9BBC", marginBottom: 0, fontSize: "0.9rem" }}
            >
              {user.is_profile_completed
                ? "Here's a snapshot of your DevMatch activity."
                : "Finish your profile to unlock skill matching and collaboration."}
            </p>
          </div>

          {!user.is_profile_completed && (
            <button
              className="btn"
              style={{
                background: "#2952A3",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 600,
                padding: "10px 20px",
                flexShrink: 0,
              }}
              onClick={() => navigate("/edit-profile")}
            >
              Complete Profile
            </button>
          )}
        </div>

        {/* Stats row */}
        <h5
          style={{
            fontWeight: 700,
            color: "#1E2B4A",
            marginBottom: 14,
            paddingLeft: 2,
          }}
        >
          Your Activity
        </h5>
        <div className="row g-3 mb-4">
          {statCards.map((s) => (
            <div key={s.label} className="col-6 col-md-4 col-lg">
              {statsLoading ? (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    padding: 20,
                    height: 110,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="spinner-border spinner-border-sm"
                    style={{ color: "#2952A3" }}
                  />
                </div>
              ) : (
                <StatCard {...s} navigate={navigate} />
              )}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h5
          style={{
            fontWeight: 700,
            color: "#1E2B4A",
            marginBottom: 14,
            paddingLeft: 2,
          }}
        >
          Quick Actions
        </h5>
        <div className="row g-3">
          {quickActions.map((action) => (
            <div key={action.path} className="col-6 col-md-4 col-lg">
              <button
                onClick={() => navigate(action.path)}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 14,
                  background: "#fff",
                  padding: "20px 12px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 12px rgba(0,0,0,0.07)";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: action.color + "18",
                    color: action.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    margin: "0 auto 10px",
                  }}
                >
                  {action.icon}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "#1E2B4A",
                    marginBottom: 3,
                  }}
                >
                  {action.label}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#8A9BBC" }}>
                  {action.desc}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
