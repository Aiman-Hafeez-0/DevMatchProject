import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaGithub, FaMoneyBillWave, FaClock } from "react-icons/fa";
import { API_URL } from "../config";

const URGENCY_STYLE = {
  High:     { background: "#FEF2F2", color: "#e53e3e", border: "1px solid #fed7d7" },
  Moderate: { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
  Low:      { background: "#f0fdf4", color: "#16a34a", border: "0.5px solid #bbf7d0" },
};

const parseTechStack = (ts) => {
  if (Array.isArray(ts)) return ts;
  if (typeof ts === "string") return ts.replace(/[{}"]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export default function ProjectCard({ project }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use the status pre-loaded by /projects/all — no extra API call needed
  const [requestStatus, setRequestStatus] = useState(project.participant_status || null);
  const [loadingAction, setLoadingAction] = useState(false);

  const handleRequest = async (e) => {
    e.stopPropagation();
    setLoadingAction(true);
    try {
      const res = await fetch(`${API_URL}/projects/${project.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Request sent!");
        setRequestStatus("pending");
      } else {
        toast.error(data.error || data.message || "Error sending request");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setLoadingAction(false);
    }
  };

  const techStack = parseTechStack(project.tech_stack);
  const urgencyStyle = URGENCY_STYLE[project.urgency] || {};
  const isOwner = user?.id === project.owner_id;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: "20px 24px",
        border: "1px solid #D0DAEE",
        transition: "box-shadow 0.2s",
        cursor: "pointer",
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(41,82,163,0.13)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)")}
    >
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        {/* Title + owner */}
        <div>
          <h5 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 2 }}>{project.title}</h5>
          <small style={{ color: "#8A9BBC" }}>by {project.owner_name}</small>
        </div>

        {/* Badges */}
        <div className="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">
          {project.urgency && (
            <span style={{ ...urgencyStyle, borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600 }}>
              <FaClock size={10} style={{ marginRight: 4 }} />{project.urgency}
            </span>
          )}
          {project.is_paid && (
            <span style={{ background: "#f0fdf4", color: "#16a34a", border: "0.5px solid #bbf7d0", borderRadius: 20, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 600 }}>
              <FaMoneyBillWave size={10} style={{ marginRight: 4 }} />Paid
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{ color: "#4A5B7A", fontSize: "0.875rem", marginBottom: 12, lineHeight: 1.55,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {project.description || "No description provided."}
      </p>

      {/* Tech stack */}
      {techStack.length > 0 && (
        <div className="d-flex flex-wrap gap-1 mb-3">
          {techStack.slice(0, 6).map((tech) => (
            <span key={tech} style={{
              background: "#E8EDF8", color: "#4B6FCE",
              borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 500,
            }}>
              {tech}
            </span>
          ))}
          {techStack.length > 6 && (
            <span style={{ color: "#8A9BBC", fontSize: "0.72rem", padding: "2px 4px" }}>+{techStack.length - 6} more</span>
          )}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center" onClick={(e) => e.stopPropagation()}>
        <small style={{ color: "#bbb" }}>
          {new Date(project.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
        </small>

        <div className="d-flex gap-2">
          {project.github_repo && (
            <a
              href={project.github_repo}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#4A5B7A", fontSize: "1.1rem" }}
              title="GitHub repo"
            >
              <FaGithub />
            </a>
          )}

          {!isOwner && (
            <>
              {requestStatus === "pending" && (
                <button disabled className="btn btn-sm"
                  style={{ background: "#fef9e7", color: "#d97706", border: "1px solid #fde68a", borderRadius: 8, fontSize: "0.78rem" }}>
                  Pending ⏳
                </button>
              )}
              {requestStatus === "accepted" && (
                <button disabled className="btn btn-sm"
                  style={{ background: "#f0fdf4", color: "#16a34a", border: "0.5px solid #bbf7d0", borderRadius: 8, fontSize: "0.78rem" }}>
                  Joined ✅
                </button>
              )}
              {!requestStatus && (
                <button
                  disabled={loadingAction}
                  onClick={handleRequest}
                  className="btn btn-sm"
                  style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.78rem" }}
                >
                  {loadingAction ? "..." : "Request to Join"}
                </button>
              )}
            </>
          )}

          {isOwner && (
            <span style={{ fontSize: "0.72rem", color: "#2952A3", fontWeight: 600 }}>Your Project</span>
          )}
        </div>
      </div>
    </div>
  );
}
