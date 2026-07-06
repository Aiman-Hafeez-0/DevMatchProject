import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaStar,
  FaBell,
  FaTrash,
  FaChevronRight,
} from "react-icons/fa";

// ── icon + accent color per notification type ──
const TYPE_META = {
  join_request: { icon: <FaUserPlus />, color: "#2952A3" },
  join_accept: { icon: <FaCheckCircle />, color: "#16a34a" },
  join_reject: { icon: <FaTimesCircle />, color: "#8A9BBC" },
  project_invite: { icon: <FaUserPlus />, color: "#4338CA" },
  invite_accepted: { icon: <FaCheckCircle />, color: "#16a34a" },
  invite_declined: { icon: <FaTimesCircle />, color: "#8A9BBC" },
  credit_received: { icon: <FaStar />, color: "#D97706" },
};

const formatTime = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

export default function NotificationsDropdown({ setNotifCount }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/projects/notifications", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setNotifCount(data.length);
      }
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const removeNotification = (notifId) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== notifId);
      setNotifCount(next.length);
      return next;
    });
  };

  const dismissNotification = async (notifId, e) => {
    e?.stopPropagation();
    removeNotification(notifId);
    try {
      await fetch(`http://localhost:5000/projects/notifications/${notifId}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Dismiss notification error:", err);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    setNotifCount(0);
    try {
      await fetch("http://localhost:5000/projects/notifications/clear", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.error("Clear all notifications error:", err);
    }
  };

  const goToProject = (projectId) => {
    if (!projectId) return;
    navigate(`/projects/${projectId}`);
  };

  const handleAccept = async (e, notifId, project_id, participant_id) => {
    e.stopPropagation();
    if (processingId) return;
    setProcessingId(notifId);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${project_id}/accept/${participant_id}`,
        { method: "PUT", credentials: "include" },
      );
      if (res.ok) {
        toast.success("Request accepted!");
        removeNotification(notifId);
      } else if (res.status === 409) {
        toast.info("This request was already handled.");
        removeNotification(notifId);
      } else {
        toast.error("Error accepting request");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (e, notifId, project_id, participant_id) => {
    e.stopPropagation();
    if (processingId) return;
    setProcessingId(notifId);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${project_id}/reject/${participant_id}`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) {
        toast.info("Request rejected!");
        removeNotification(notifId);
      } else if (res.status === 409) {
        toast.info("This request was already handled.");
        removeNotification(notifId);
      } else {
        toast.error("Error rejecting request");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptInvite = async (e, notifId, project_id) => {
    e.stopPropagation();
    if (processingId) return;
    setProcessingId(notifId);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${project_id}/invite/accept`,
        { method: "PUT", credentials: "include" },
      );
      if (res.ok) {
        toast.success("You joined the project!");
        removeNotification(notifId);
      } else {
        const d = await res.json();
        toast.error(d.error || "Could not accept invite");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvite = async (e, notifId, project_id) => {
    e.stopPropagation();
    if (processingId) return;
    setProcessingId(notifId);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${project_id}/invite/decline`,
        { method: "DELETE", credentials: "include" },
      );
      if (res.ok) {
        toast.info("Invite declined");
        removeNotification(notifId);
      } else {
        toast.error("Error declining invite");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 10px 40px rgba(41,82,163,0.18)",
        border: "1px solid #E5EAF6",
        width: 340,
        maxHeight: 480,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid #EEF2FB",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaBell size={14} color="#2952A3" />
          <span
            style={{ fontWeight: 700, fontSize: "0.92rem", color: "#1E2B4A" }}
          >
            Notifications
          </span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.75rem",
              color: "#8A9BBC",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A9BBC")}
          >
            <FaTrash size={10} /> Clear all
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {loading && (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <div
              className="spinner-border spinner-border-sm"
              style={{ color: "#2952A3" }}
            />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <FaBell size={28} color="#D0DAEE" style={{ marginBottom: 10 }} />
            <p style={{ color: "#A6B3CF", fontSize: "0.85rem", margin: 0 }}>
              You're all caught up!
            </p>
          </div>
        )}

        {notifications.map((n) => {
          let parsedData = {};
          try {
            parsedData =
              typeof n.data === "string" ? JSON.parse(n.data) : n.data || {};
          } catch {
            parsedData = {};
          }

          const meta = TYPE_META[n.type] || {
            icon: <FaBell />,
            color: "#8A9BBC",
          };
          const projectId = parsedData.project_id;
          const isClickable =
            !!projectId && !["join_request", "project_invite"].includes(n.type);
          // join_request / project_invite need explicit Accept/Reject buttons, so the whole
          // card isn't a nav link for those (avoids accidental navigation instead of action)

          return (
            <div
              key={n.id}
              onClick={() => isClickable && goToProject(projectId)}
              style={{
                display: "flex",
                gap: 10,
                padding: "12px 16px",
                borderBottom: "1px solid #F5F7FC",
                cursor: isClickable ? "pointer" : "default",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (isClickable) e.currentTarget.style.background = "#F7F9FD";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: meta.color + "18",
                  color: meta.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {meta.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <p
                    style={{
                      fontSize: "0.83rem",
                      color: "#1E2B4A",
                      margin: 0,
                      lineHeight: 1.45,
                    }}
                  >
                    {n.message}
                  </p>
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={(e) => dismissNotification(n.id, e)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#C7D0E5",
                      fontSize: "0.95rem",
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#DC2626")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#C7D0E5")
                    }
                  >
                    ×
                  </button>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-1">
                  <span style={{ fontSize: "0.68rem", color: "#A6B3CF" }}>
                    {formatTime(n.created_at)}
                  </span>
                  {isClickable && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: meta.color,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontWeight: 600,
                      }}
                    >
                      View <FaChevronRight size={8} />
                    </span>
                  )}
                </div>

                {/* Action buttons per type */}
                {n.type === "join_request" && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      disabled={processingId === n.id}
                      onClick={(e) =>
                        handleAccept(
                          e,
                          n.id,
                          parsedData.project_id,
                          parsedData.participant_id,
                        )
                      }
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {processingId === n.id ? "..." : "Accept"}
                    </button>
                    <button
                      disabled={processingId === n.id}
                      onClick={(e) =>
                        handleReject(
                          e,
                          n.id,
                          parsedData.project_id,
                          parsedData.participant_id,
                        )
                      }
                      style={{
                        background: "#fff",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {processingId === n.id ? "..." : "Reject"}
                    </button>
                  </div>
                )}

                {n.type === "project_invite" && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      disabled={processingId === n.id}
                      onClick={(e) =>
                        handleAcceptInvite(e, n.id, parsedData.project_id)
                      }
                      style={{
                        background: "#16a34a",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {processingId === n.id ? "..." : "Accept"}
                    </button>
                    <button
                      disabled={processingId === n.id}
                      onClick={(e) =>
                        handleDeclineInvite(e, n.id, parsedData.project_id)
                      }
                      style={{
                        background: "#fff",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        padding: "4px 12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {processingId === n.id ? "..." : "Decline"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
