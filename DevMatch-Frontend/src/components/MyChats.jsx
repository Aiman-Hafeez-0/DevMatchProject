import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaComments, FaRegClock, FaRegDotCircle } from "react-icons/fa";
import { API_URL } from "../config";

export default function MyChats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/chat/my-chats`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        setChats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load your chats.");
        setLoading(false);
      });
  }, []);

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const avatarLetter = (title) => (title?.charAt(0) || "?").toUpperCase();

  // colour cycle for avatars based on project_id
  const avatarColors = ["#2952A3", "#4B6FCE", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
  const avatarColor = (id) => avatarColors[id % avatarColors.length];

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-border" style={{ color: "#2952A3" }} role="status" />
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "#EEF2FB",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
        backgroundSize: '80px 80px',
        minHeight: "100vh",
        padding: "30px 16px",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: 640,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid #D0DAEE" }}
        >
          <FaComments size={22} color="#2952A3" />
          <h5 className="mb-0 fw-bold">My Chats</h5>
        </div>

        {/* Error */}
        {error && <div className="alert alert-danger m-3">{error}</div>}

        {/* Empty state */}
        {!error && chats.length === 0 && (
          <div className="text-center py-5 px-4">
            <FaComments size={48} color="#2952A3" style={{ opacity: 0.25 }} />
            <p className="mt-3 text-muted mb-3">
              No active chats yet.<br />
              Join a project and get accepted to start collaborating.
            </p>
            <button
              className="btn btn-sm px-4"
              style={{ backgroundColor: "#2952A3", color: "#fff", border: "none", borderRadius: 8 }}
              onClick={() => navigate("/projects")}
            >
              Browse Projects
            </button>
          </div>
        )}

        {/* Chat list */}
        {chats.map((chat) => {
          const isOwner = user?.id === chat.owner_id;
          const lastMsg = chat.last_message
            ? chat.last_sender_id === user?.id
              ? `You: ${chat.last_message}`
              : chat.last_message
            : "No messages yet — say hello! 👋";

          return (
            <button
              key={chat.project_id}
              className="w-100 d-flex align-items-center gap-3 px-4 py-3 text-start"
              style={{
                border: "none",
                borderBottom: "1px solid #EEF2FB",
                background: "none",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#EEF2FB")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              onClick={() => navigate(`/chat/project/${chat.project_id}`)}
            >
              {/* Avatar */}
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: avatarColor(chat.project_id),
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                }}
              >
                {avatarLetter(chat.project_title)}
              </div>

              {/* Content */}
              <div className="flex-grow-1 overflow-hidden">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold text-truncate" style={{ maxWidth: "70%" }}>
                    {chat.project_title}
                  </span>
                  <small className="text-muted ms-2 flex-shrink-0">
                    {formatTime(chat.last_message_at)}
                  </small>
                </div>
                <p
                  className="mb-0 text-truncate small"
                  style={{ color: "#8A9BBC", maxWidth: "95%" }}
                >
                  {lastMsg}
                </p>
              </div>

              {/* Owner badge */}
              {isOwner && (
                <span
                  className="badge flex-shrink-0"
                  style={{ background: "#2952A3", fontSize: "0.65rem" }}
                >
                  Owner
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
