import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaFire, FaGithub, FaClock, FaMoneyBillWave, FaStar } from "react-icons/fa";
import { API_URL } from "../config";

const BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: '80px 80px',
  minHeight: "100vh",
  padding: "32px 20px",
};

const URGENCY = {
  High:     { background: "#FEF2F2", color: "#e53e3e", border: "1px solid #fed7d7" },
  Moderate: { background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" },
  Low:      { background: "#f0fdf4", color: "#16a34a", border: "0.5px solid #bbf7d0" },
};

// Visual ring showing match %
function MatchRing({ score }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10B981" : score >= 40 ? "#D97706" : "#2952A3";

  return (
    <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
      <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="#D0DAEE" strokeWidth="5" />
        <circle
          cx="34" cy="34" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontWeight: 800, fontSize: "0.9rem", color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: "0.55rem", color: "#8A9BBC", lineHeight: 1.2 }}>match</span>
      </div>
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noSkills, setNoSkills] = useState(false);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [requesting, setRequesting] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/projects/matches`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "no_skills") { setNoSkills(true); return; }
        if (Array.isArray(data)) setMatches(data);
        else toast.error("Could not load matches");
      })
      .catch(() => toast.error("Server error"))
      .finally(() => setLoading(false));
  }, []);

  const handleRequest = async (projectId) => {
    setRequesting(projectId);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/request`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Request sent!");
        setMatches((prev) =>
          prev.map((m) => m.id === projectId ? { ...m, requested: true } : m)
        );
      } else {
        toast.error(data.error || data.message || "Error");
      }
    } catch { toast.error("Server error"); }
    finally { setRequesting(null); }
  };

  const filtered = matches.filter((m) => m.match_score >= scoreFilter);
  const topMatch = matches[0];

  if (loading) return (
    <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner-border" style={{ color: "#2952A3" }} />
    </div>
  );

  if (noSkills) return (
    <div style={{ ...BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 420, textAlign: "center", boxShadow: "0 4px 24px rgba(41,82,163,0.1)" }}>
        <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎯</div>
        <h5 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 8 }}>Set up your skills first</h5>
        <p style={{ color: "#8A9BBC", marginBottom: 20 }}>
          Add your skills to your profile so DevMatch can find the best-fit projects for you.
        </p>
        <button
          className="btn"
          style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600 }}
          onClick={() => navigate("/edit-profile")}
        >
          Complete Profile
        </button>
      </div>
    </div>
  );

  return (
    <div style={BG}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <FaFire color="#2952A3" /> Your Matches
            </h3>
            <p style={{ color: "#8A9BBC", marginBottom: 0 }}>
              {filtered.length} project{filtered.length !== 1 ? "s" : ""} matched to your skill set
            </p>
          </div>

          {/* Score filter */}
          <div style={{ background: "#fff", borderRadius: 10, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: 220 }}>
            <div className="d-flex justify-content-between mb-1">
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4A5B7A" }}>Min Match Score</label>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2952A3" }}>{scoreFilter}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={10}
              value={scoreFilter}
              onChange={(e) => setScoreFilter(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2952A3" }}
            />
          </div>
        </div>

        {/* Top match highlight */}
        {topMatch && topMatch.match_score >= 60 && scoreFilter === 0 && (
          <div style={{
            background: "linear-gradient(135deg, #2952A3 0%, #4B6FCE 100%)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 20,
            color: "#fff", display: "flex", alignItems: "center", gap: 16,
            boxShadow: "0 4px 20px rgba(41,82,163,0.25)",
          }}>
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                🌟 Best Match for You
              </div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>{topMatch.title}</div>
              <div style={{ fontSize: "0.82rem", opacity: 0.85 }}>by {topMatch.owner_name}</div>
            </div>
            <div style={{ marginLeft: "auto", flexShrink: 0, textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1 }}>{topMatch.match_score}%</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>match</div>
            </div>
          </div>
        )}

        {/* Empty */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", background: "#fff", borderRadius: 16 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔍</div>
            <p style={{ color: "#8A9BBC" }}>No projects match that score threshold yet.</p>
            <button
              className="btn btn-sm"
              style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 8 }}
              onClick={() => setScoreFilter(0)}
            >Show all</button>
          </div>
        )}

        {/* Match cards */}
        <div className="d-flex flex-column gap-3">
          {filtered.map((project) => {
            const urgencyStyle = URGENCY[project.urgency] || {};

            return (
              <div
                key={project.id}
                style={{
                  background: "#fff", borderRadius: 14,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  border: project.match_score >= 70 ? "1px solid #bbf7d0" : "1px solid #D0DAEE",
                  padding: "20px 24px",
                  transition: "box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 6px 24px rgba(41,82,163,0.13)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)")}
              >
                <div className="d-flex gap-3 align-items-start">
                  {/* Match ring */}
                  <MatchRing score={project.match_score} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + badges */}
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <div>
                        <h5 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 2 }}>{project.title}</h5>
                        <small style={{ color: "#8A9BBC" }}>by {project.owner_name}</small>
                      </div>
                      <div className="d-flex gap-2 flex-wrap flex-shrink-0">
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
                    <p style={{
                      color: "#4A5B7A", fontSize: "0.875rem", marginBottom: 10, lineHeight: 1.55,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {project.description}
                    </p>

                    {/* Skills breakdown */}
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {project.matched_skills.map((s) => (
                        <span key={s} style={{
                          background: "#f0fdf4", color: "#16a34a",
                          border: "0.5px solid #bbf7d0",
                          borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 500,
                        }}>
                          ✓ {s}
                        </span>
                      ))}
                      {project.missing_skills.map((s) => (
                        <span key={s} style={{
                          background: "#F2F5FC", color: "#999",
                          border: "1px solid #e5e5e5",
                          borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem",
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Bottom row */}
                    <div className="d-flex justify-content-between align-items-center" onClick={(e) => e.stopPropagation()}>
                      <small style={{ color: "#bbb" }}>
                        {new Date(project.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </small>
                      <div className="d-flex gap-2 align-items-center">
                        {project.github_repo && (
                          <a href={project.github_repo} target="_blank" rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "#4A5B7A", fontSize: "1.1rem" }}>
                            <FaGithub />
                          </a>
                        )}
                        {project.requested ? (
                          <button disabled className="btn btn-sm"
                            style={{ background: "#fef9e7", color: "#d97706", border: "1px solid #fde68a", borderRadius: 8, fontSize: "0.78rem" }}>
                            Pending ⏳
                          </button>
                        ) : (
                          <button
                            disabled={requesting === project.id}
                            className="btn btn-sm"
                            style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600 }}
                            onClick={() => handleRequest(project.id)}
                          >
                            {requesting === project.id ? "..." : "Request to Join"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
