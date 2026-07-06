import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaGithub,
  FaClock,
  FaMoneyBillWave,
  FaArrowLeft,
  FaCode,
  FaStar,
  FaCheckCircle,
} from "react-icons/fa";

const AVATAR_COLORS = [
  "#2952A3",
  "#4B6FCE",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

const EXP_BADGE = {
  Beginner: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "0.5px solid #bbf7d0",
  },
  Intermediate: {
    background: "#fffbeb",
    color: "#d97706",
    border: "1px solid #fde68a",
  },
  Advanced: {
    background: "#FEF2F2",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
  },
};
const URGENCY_BADGE = {
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
  Low: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "0.5px solid #bbf7d0",
  },
};

const BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: "80px 80px",
  minHeight: "100vh",
  padding: "32px 16px",
};

function ProjectMini({ project, onClick }) {
  const urgency = URGENCY_BADGE[project.urgency] || {};
  const tech = Array.isArray(project.tech_stack) ? project.tech_stack : [];
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "14px 16px",
        border: "1px solid #D0DAEE",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(41,82,163,0.10)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <span
          style={{ fontWeight: 600, color: "#1E2B4A", fontSize: "0.88rem" }}
        >
          {project.title}
        </span>
        <div className="d-flex gap-1 flex-shrink-0">
          {project.urgency && (
            <span
              style={{
                ...urgency,
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: "0.68rem",
                fontWeight: 600,
              }}
            >
              {project.urgency}
            </span>
          )}
          {project.is_paid && (
            <span
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                border: "0.5px solid #bbf7d0",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: "0.68rem",
                fontWeight: 600,
              }}
            >
              Paid
            </span>
          )}
        </div>
      </div>
      <div className="d-flex flex-wrap gap-1">
        {tech.slice(0, 4).map((t) => (
          <span
            key={t}
            style={{
              background: "#E8EDF8",
              color: "#4B6FCE",
              borderRadius: 5,
              padding: "1px 7px",
              fontSize: "0.68rem",
            }}
          >
            {t}
          </span>
        ))}
        {tech.length > 4 && (
          <span style={{ color: "#8A9BBC", fontSize: "0.68rem" }}>
            +{tech.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/profiles/user/${userId}`, {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Profile not found");
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

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

  if (error || !profile)
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
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>😕</div>
          <p style={{ color: "#8A9BBC" }}>{error || "Profile not found"}</p>
          <button
            className="btn btn-sm"
            style={{
              background: "#2952A3",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
            onClick={() => navigate("/profiles")}
          >
            ← Back to Profiles
          </button>
        </div>
      </div>
    );

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const expStyle = EXP_BADGE[profile.experience_level] || {
    background: "#F2F5FC",
    color: "#8A9BBC",
  };
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString([], {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div style={BG}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Back */}
        <button
          onClick={() => navigate("/profiles")}
          style={{
            background: "none",
            border: "none",
            color: "#2952A3",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
          }}
        >
          <FaArrowLeft size={13} /> Back to Profiles
        </button>

        {/* Hero card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(41,82,163,0.1)",
            marginBottom: 16,
          }}
        >
          {/* Gradient header strip */}
          <div
            style={{
              height: 90,
              background: "linear-gradient(135deg, #2952A3 0%, #1E3D7A 100%)",
            }}
          />

          <div style={{ padding: "0 28px 24px" }}>
            {/* Avatar — overlaps the strip */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: avatarColor(profile.id),
                color: "#fff",
                fontWeight: 800,
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid #fff",
                marginTop: -40,
                marginBottom: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {(fullName || profile.user_name || "?").charAt(0).toUpperCase()}
            </div>

            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <h4
                  style={{ fontWeight: 800, color: "#1E2B4A", marginBottom: 2 }}
                >
                  {fullName || profile.user_name}
                </h4>
                <div style={{ color: "#8A9BBC", fontSize: "0.85rem" }}>
                  @{profile.user_name}
                </div>
                {memberSince && (
                  <div
                    style={{ color: "#bbb", fontSize: "0.75rem", marginTop: 4 }}
                  >
                    Member since {memberSince}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {profile.experience_level && (
                  <span
                    style={{
                      ...expStyle,
                      borderRadius: 20,
                      padding: "5px 14px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {profile.experience_level}
                  </span>
                )}
                {profile.availability && (
                  <span
                    style={{
                      background: "#f0f8ff",
                      color: "#0EA5E9",
                      border: "1px solid #bae6fd",
                      borderRadius: 20,
                      padding: "5px 14px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    <FaClock size={10} style={{ marginRight: 4 }} />
                    {profile.availability} hrs/week
                  </span>
                )}
                {profile.github_url && (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#1E2B4A",
                      color: "#fff",
                      borderRadius: 20,
                      padding: "5px 14px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <FaGithub size={12} /> GitHub
                  </a>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p
                style={{
                  color: "#4A5B7A",
                  lineHeight: 1.65,
                  marginTop: 16,
                  marginBottom: 0,
                  fontSize: "0.9rem",
                }}
              >
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
              <FaCode size={12} /> Skills · {skills.length}
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  style={{
                    background: "#E8EDF8",
                    color: "#4B6FCE",
                    border: "1px solid #C7D3EE",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Credibility Ledger — the differentiator section ── */}
        {profile.credibility?.total_contributions > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(41,82,163,0.08)",
              border: "1px solid #D9E1F2",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 4,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <FaCheckCircle size={12} /> Verified Contributions
            </h6>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#8A9BBC",
                margin: "0 0 16px",
              }}
            >
              Problem statements solved on real projects, attested by the
              project owner — not self-reported.
            </p>

            {/* Summary stat row */}
            <div className="row g-2 mb-3">
              <div className="col-4">
                <div
                  style={{
                    background: "#EEF2FB",
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "#2952A3",
                    }}
                  >
                    {profile.credibility.total_contributions}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#7A8BB0" }}>
                    Problems Solved
                  </div>
                </div>
              </div>
              <div className="col-4">
                <div
                  style={{
                    background: "#FFFBEB",
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "#D97706",
                    }}
                  >
                    {profile.credibility.avg_stars ?? "—"}{" "}
                    <FaStar size={14} style={{ marginBottom: 3 }} />
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#7A8BB0" }}>
                    Avg Rating
                  </div>
                </div>
              </div>
              <div className="col-4">
                <div
                  style={{
                    background: "#F0FDF4",
                    borderRadius: 10,
                    padding: "12px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      color: "#16a34a",
                    }}
                  >
                    {profile.credibility.paid_pct ?? 0}%
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#7A8BB0" }}>
                    Paid Work
                  </div>
                </div>
              </div>
            </div>

            {/* Contribution list */}
            <div className="d-flex flex-column gap-2">
              {profile.contributions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "#F7F9FD",
                    borderRadius: 10,
                    padding: "12px 14px",
                    border: "1px solid #E5EAF6",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "#1E2B4A",
                        cursor: "pointer",
                      }}
                      onClick={() => navigate(`/projects/${c.project_id}`)}
                    >
                      {c.project_title}
                    </span>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          size={10}
                          color={i < c.stars ? "#F59E0B" : "#E5EAF6"}
                        />
                      ))}
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#4A5B7A",
                      margin: "0 0 6px",
                      lineHeight: 1.5,
                    }}
                  >
                    ✅ Solved: <strong>{c.problem_statement}</strong>
                  </p>
                  {c.note && (
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: "#8A9BBC",
                        fontStyle: "italic",
                        margin: "0 0 6px",
                      }}
                    >
                      "{c.note}"
                    </p>
                  )}
                  <div
                    className="d-flex align-items-center gap-2 flex-wrap"
                    style={{ fontSize: "0.68rem", color: "#A6B3CF" }}
                  >
                    <span>
                      Attested by{" "}
                      <strong style={{ color: "#2952A3" }}>
                        {c.attested_by_name}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(c.created_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {c.is_paid && (
                      <span
                        style={{
                          background: "#f0fdf4",
                          color: "#16a34a",
                          borderRadius: 10,
                          padding: "1px 8px",
                          fontWeight: 600,
                        }}
                      >
                        💰 Paid work
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owned projects */}
        {profile.owned_projects?.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
              }}
            >
              🚀 Projects Created · {profile.owned_projects.length}
            </h6>
            <div className="d-flex flex-column gap-2">
              {profile.owned_projects.map((p) => (
                <ProjectMini
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/projects/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Joined projects */}
        {profile.joined_projects?.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
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
              }}
            >
              🤝 Projects Joined · {profile.joined_projects.length}
            </h6>
            <div className="d-flex flex-column gap-2">
              {profile.joined_projects.map((p) => (
                <ProjectMini
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/projects/${p.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
