import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaGithub,
  FaClock,
  FaMoneyBillWave,
  FaLock,
  FaComments,
  FaArrowLeft,
  FaUserPlus,
  FaUsers,
  FaCalendarAlt,
  FaStar,
} from "react-icons/fa";

const BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: "80px 80px",
  minHeight: "100vh",
  padding: "32px 16px",
};

const URGENCY = {
  High: {
    background: "#FEF2F2",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
  },
  Moderate: {
    background: "#fffbeb",
    color: "#d97706",
    border: "1px solid #fde68a",
  },
  Low: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" },
};

const AVATAR_COLORS = [
  "#2952A3",
  "#4338CA",
  "#0EA5E9",
  "#10B981",
  "#D97706",
  "#DC2626",
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participantStatus, setParticipantStatus] = useState(null); // null | 'pending' | 'accepted'
  const [requesting, setRequesting] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/projects/${projectId}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        setProject(null);
        setLoading(false);
      });

    fetch("http://localhost:5000/projects/participant-status", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: parseInt(projectId) }),
    })
      .then((res) => res.json())
      .then((data) => setParticipantStatus(data.status || null))
      .catch(() => setParticipantStatus(null));
  }, [projectId]);

  // Once we know the user can access chat, fetch the member list to show on this page too
  useEffect(() => {
    const isOwnerCheck = user?.id === project?.owner_id;
    const canSeeMembers = isOwnerCheck || participantStatus === "accepted";
    if (!canSeeMembers) return;

    fetch(`http://localhost:5000/chat/room/${projectId}`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.members) setMembers(data.members);
      })
      .catch(() => {});
  }, [project, participantStatus, projectId, user]);

  const handleRequestToJoin = async () => {
    setRequesting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${projectId}/request`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Request sent!");
        setParticipantStatus("pending");
      } else {
        toast.error(data.error || data.message || "Could not send request");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setRequesting(false);
    }
  };

  const formatList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value
      .replace(/[{}"]/g, "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // ── Give Credit modal ──
  const [creditingMember, setCreditingMember] = useState(null);
  const [creditForm, setCreditForm] = useState({
    problem_statement: "",
    stars: 5,
    is_paid: false,
    note: "",
  });
  const [creditSubmitting, setCreditSubmitting] = useState(false);

  const openCreditModal = (member) => {
    setCreditingMember(member);
    setCreditForm({
      problem_statement: "",
      stars: 5,
      is_paid: false,
      note: "",
    });
  };

  const submitCredit = async () => {
    if (!creditForm.problem_statement.trim()) {
      toast.warning("Select or describe the problem statement they solved");
      return;
    }
    setCreditSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/projects/${projectId}/contributions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            contributor_id: creditingMember.id,
            problem_statement: creditForm.problem_statement,
            is_paid: creditForm.is_paid,
            stars: creditForm.stars,
            note: creditForm.note,
          }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(`Credit given to ${creditingMember.user_name}!`);
        setCreditingMember(null);
      } else {
        toast.error(data.error || "Could not give credit");
      }
    } catch {
      toast.error("Server error");
    } finally {
      setCreditSubmitting(false);
    }
  };

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

  if (!project)
    return (
      <div
        style={{
          ...BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>😕</div>
          <p style={{ color: "#7A8BB0", marginBottom: 16 }}>
            Project not found.
          </p>
          <button
            className="btn btn-sm"
            style={{
              background: "#2952A3",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
            onClick={() => navigate("/projects")}
          >
            ← Browse Projects
          </button>
        </div>
      </div>
    );

  const isOwner = user?.id === project.owner_id;
  const isAccepted = participantStatus === "accepted";
  const isPending = participantStatus === "pending";
  const canChat = isOwner || isAccepted;
  const canRequest = !isOwner && !participantStatus;
  const techStack = formatList(project.tech_stack);
  const urgencyStyle = URGENCY[project.urgency] || {};

  return (
    <div style={BG}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Back */}
        <button
          onClick={() => navigate("/projects")}
          style={{
            background: "none",
            border: "none",
            color: "#2952A3",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            fontSize: "0.85rem",
          }}
        >
          <FaArrowLeft size={12} /> Back to Projects
        </button>

        {/* Hero card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "26px 28px",
            boxShadow: "0 4px 24px rgba(41,82,163,0.10)",
            marginBottom: 16,
            border: "1px solid #D9E1F2",
          }}
        >
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <h2
                style={{ fontWeight: 800, color: "#1E2B4A", marginBottom: 6 }}
              >
                {project.title}
              </h2>
              <div
                className="d-flex align-items-center gap-2 flex-wrap"
                style={{ fontSize: "0.85rem", color: "#7A8BB0" }}
              >
                <span>
                  Posted by{" "}
                  <strong style={{ color: "#2952A3" }}>
                    {project.owner_name}
                  </strong>
                </span>
                <span>·</span>
                <span className="d-flex align-items-center gap-1">
                  <FaCalendarAlt size={11} />
                  {new Date(project.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {canChat && (
              <button
                className="btn d-flex align-items-center gap-2"
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  padding: "9px 18px",
                  flexShrink: 0,
                }}
                onClick={() => navigate(`/chat/project/${projectId}`)}
              >
                <FaComments /> Open Chat
              </button>
            )}

            {canRequest && (
              <button
                className="btn d-flex align-items-center gap-2"
                disabled={requesting}
                style={{
                  background: "#2952A3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontWeight: 600,
                  padding: "9px 18px",
                  flexShrink: 0,
                }}
                onClick={handleRequestToJoin}
              >
                <FaUserPlus /> {requesting ? "Sending..." : "Request to Join"}
              </button>
            )}
          </div>

          {/* Badges */}
          <div className="d-flex gap-2 flex-wrap">
            {project.urgency && (
              <span
                style={{
                  ...urgencyStyle,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                <FaClock size={10} style={{ marginRight: 5 }} />
                {project.urgency}
              </span>
            )}
            {project.is_paid && (
              <span
                style={{
                  background: "#f0fdf4",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                <FaMoneyBillWave size={10} style={{ marginRight: 5 }} />
                Paid
              </span>
            )}
            {project.is_private && (
              <span
                style={{
                  background: "#F2F5FC",
                  color: "#7A8BB0",
                  border: "1px solid #D9E1F2",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                <FaLock size={10} style={{ marginRight: 5 }} />
                Private
              </span>
            )}
            {isOwner && (
              <span
                style={{
                  background: "#EEF2FB",
                  color: "#2952A3",
                  border: "1px solid #C7D3EE",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                👑 You own this project
              </span>
            )}
          </div>
        </div>

        {/* Status banner */}
        {isPending && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92600a",
              borderRadius: 12,
              padding: "12px 18px",
              marginBottom: 16,
              fontSize: "0.88rem",
              fontWeight: 500,
            }}
          >
            ⏳ Your join request is pending approval from the project owner.
          </div>
        )}
        {isAccepted && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              borderRadius: 12,
              padding: "12px 18px",
              marginBottom: 16,
              fontSize: "0.88rem",
              fontWeight: 500,
            }}
          >
            ✅ You're an accepted member of this project — chat is open!
          </div>
        )}

        {/* Description */}
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: "22px 24px",
            marginBottom: 16,
            boxShadow: "0 2px 12px rgba(41,82,163,0.06)",
            border: "1px solid #D9E1F2",
          }}
        >
          <h6
            style={{
              fontWeight: 700,
              color: "#2952A3",
              marginBottom: 10,
              textTransform: "uppercase",
              fontSize: "0.72rem",
              letterSpacing: 0.8,
            }}
          >
            Description
          </h6>
          <p
            style={{
              color: "#4A5A82",
              lineHeight: 1.7,
              margin: 0,
              fontSize: "0.92rem",
            }}
          >
            {project.description || "No description provided."}
          </p>
        </div>

        {/* Tech stack + details grid */}
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "20px 22px",
                height: "100%",
                boxShadow: "0 2px 12px rgba(41,82,163,0.06)",
                border: "1px solid #D9E1F2",
              }}
            >
              <h6
                style={{
                  fontWeight: 700,
                  color: "#2952A3",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  fontSize: "0.72rem",
                  letterSpacing: 0.8,
                }}
              >
                Tech Stack
              </h6>
              {techStack.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {techStack.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "#EEF0FD",
                        color: "#4338CA",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#A6B3CF", fontSize: "0.85rem", margin: 0 }}>
                  No tech stack specified.
                </p>
              )}
            </div>
          </div>
          <div className="col-sm-6">
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "20px 22px",
                height: "100%",
                boxShadow: "0 2px 12px rgba(41,82,163,0.06)",
                border: "1px solid #D9E1F2",
              }}
            >
              <h6
                style={{
                  fontWeight: 700,
                  color: "#2952A3",
                  marginBottom: 12,
                  textTransform: "uppercase",
                  fontSize: "0.72rem",
                  letterSpacing: 0.8,
                }}
              >
                Links
              </h6>
              {project.github_repo ? (
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#2952A3",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <FaGithub /> View Repository
                </a>
              ) : (
                <p style={{ color: "#A6B3CF", fontSize: "0.85rem", margin: 0 }}>
                  No GitHub link provided.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Problem Statements */}
        {formatList(project.problem_statements).length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "22px 24px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(41,82,163,0.06)",
              border: "1px solid #D9E1F2",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 12,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
              }}
            >
              Problem Statements
            </h6>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "#4A5A82",
                fontSize: "0.88rem",
                lineHeight: 1.8,
              }}
            >
              {formatList(project.problem_statements).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Members (visible to owner + accepted members) */}
        {canChat && members.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "22px 24px",
              boxShadow: "0 2px 12px rgba(41,82,163,0.06)",
              border: "1px solid #D9E1F2",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 14,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FaUsers size={12} /> Team Members · {members.length}
            </h6>
            <div className="d-flex flex-column gap-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="d-flex align-items-center justify-content-between"
                  style={{ padding: "6px 0" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: avatarColor(m.id),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                      }}
                    >
                      {(m.user_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#1E2B4A",
                        fontWeight: 500,
                      }}
                    >
                      {m.user_name}
                      {m.id === project.owner_id && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "#2952A3",
                            marginLeft: 6,
                            fontWeight: 700,
                          }}
                        >
                          OWNER
                        </span>
                      )}
                    </span>
                  </div>

                  {isOwner && m.id !== user?.id && (
                    <button
                      onClick={() => openCreditModal(m)}
                      style={{
                        background: "#FFFBEB",
                        color: "#D97706",
                        border: "1px solid #fde68a",
                        borderRadius: 8,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "4px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <FaStar size={10} /> Give Credit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Give Credit Modal ── */}
      {creditingMember && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreditingMember(null);
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ fontWeight: 700, color: "#1E2B4A", margin: 0 }}>
                <FaStar style={{ marginRight: 8, color: "#D97706" }} />
                Give Credit to {creditingMember.user_name}
              </h5>
              <button
                onClick={() => setCreditingMember(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  color: "#A6B3CF",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <p
              style={{ fontSize: "0.8rem", color: "#8A9BBC", marginBottom: 18 }}
            >
              This becomes a verified entry on their public profile — attesting
              they solved this specific problem on your project.
            </p>

            {/* Problem statement select */}
            <label
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#4A5B7A",
                marginBottom: 5,
                display: "block",
              }}
            >
              Which problem statement did they solve?
            </label>
            {formatList(project.problem_statements).length > 0 ? (
              <select
                value={creditForm.problem_statement}
                onChange={(e) =>
                  setCreditForm((f) => ({
                    ...f,
                    problem_statement: e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #D9E1F2",
                  borderRadius: 8,
                  fontSize: "0.88rem",
                  outline: "none",
                  marginBottom: 16,
                  background: "#fff",
                }}
              >
                <option value="">-- Select a problem statement --</option>
                {formatList(project.problem_statements).map((ps, i) => (
                  <option key={i} value={ps}>
                    {ps}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={creditForm.problem_statement}
                onChange={(e) =>
                  setCreditForm((f) => ({
                    ...f,
                    problem_statement: e.target.value,
                  }))
                }
                placeholder="Describe what they solved..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1.5px solid #D9E1F2",
                  borderRadius: 8,
                  fontSize: "0.88rem",
                  outline: "none",
                  marginBottom: 16,
                }}
              />
            )}

            {/* Star rating */}
            <label
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#4A5B7A",
                marginBottom: 6,
                display: "block",
              }}
            >
              Rating
            </label>
            <div className="d-flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCreditForm((f) => ({ ...f, stars: star }))}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <FaStar
                    size={22}
                    color={star <= creditForm.stars ? "#F59E0B" : "#E5EAF6"}
                  />
                </button>
              ))}
            </div>

            {/* Paid toggle */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#1E2B4A",
              }}
            >
              <input
                type="checkbox"
                checked={creditForm.is_paid}
                onChange={(e) =>
                  setCreditForm((f) => ({ ...f, is_paid: e.target.checked }))
                }
              />
              💰 This was paid work
            </label>

            {/* Optional note */}
            <label
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#4A5B7A",
                marginBottom: 5,
                display: "block",
              }}
            >
              Note (optional)
            </label>
            <textarea
              rows={2}
              value={creditForm.note}
              onChange={(e) =>
                setCreditForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="e.g. Implemented the matching algorithm end to end, great communication throughout."
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1.5px solid #D9E1F2",
                borderRadius: 8,
                fontSize: "0.85rem",
                outline: "none",
                marginBottom: 20,
                resize: "vertical",
              }}
            />

            <div className="d-flex gap-2 justify-content-end">
              <button
                onClick={() => setCreditingMember(null)}
                style={{
                  padding: "9px 20px",
                  border: "1.5px solid #D9E1F2",
                  borderRadius: 8,
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.88rem",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCredit}
                disabled={creditSubmitting}
                style={{
                  padding: "9px 24px",
                  background: "#D97706",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: creditSubmitting ? "not-allowed" : "pointer",
                  fontSize: "0.88rem",
                }}
              >
                {creditSubmitting ? "Submitting..." : "Give Credit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
