import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaGithub, FaSearch, FaUser } from "react-icons/fa";

const BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: "80px 80px",
  minHeight: "100vh",
  padding: "32px 20px",
};

const AVATAR_COLORS = [
  "#2952A3",
  "#4B6FCE",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

const EXP_STYLE = {
  Beginner: { background: "#f0fdf4", color: "#16a34a" },
  Intermediate: { background: "#fffbeb", color: "#d97706" },
  Advanced: { background: "#FEF2F2", color: "#e53e3e" },
};

export default function ProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expFilter, setExpFilter] = useState("All");

  useEffect(() => {
    fetch("http://localhost:5000/profiles/all", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const completed = data.filter((p) => p.is_profile_completed);
        setProfiles(completed);
        setFiltered(completed);
      })
      .catch(() => toast.error("Failed to fetch profiles"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...profiles];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.user_name?.toLowerCase().includes(q) ||
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.skills?.join(" ").toLowerCase().includes(q) ||
          p.bio?.toLowerCase().includes(q),
      );
    }
    if (expFilter !== "All")
      result = result.filter((p) => p.experience_level === expFilter);
    setFiltered(result);
  }, [search, expFilter, profiles]);

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

  return (
    <div style={BG}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 4 }}>
            Developer Profiles
          </h3>
          <p style={{ color: "#8A9BBC", marginBottom: 0 }}>
            {filtered.length} developer{filtered.length !== 1 ? "s" : ""}{" "}
            available
          </p>
        </div>

        {/* Search + filter */}
        <div
          className="d-flex flex-wrap gap-2 mb-4"
          style={{
            background: "#fff",
            padding: "14px 16px",
            borderRadius: 12,
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <FaSearch
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#ccc",
              }}
            />
            <input
              type="text"
              placeholder="Search by name, skills, bio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                border: "1.5px solid #D0DAEE",
                borderRadius: 8,
                fontSize: "0.85rem",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2952A3")}
              onBlur={(e) => (e.target.style.borderColor = "#D0DAEE")}
            />
          </div>
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1.5px solid #D0DAEE",
              borderRadius: 8,
              fontSize: "0.85rem",
              outline: "none",
            }}
          >
            <option>All</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        {filtered.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>👥</div>
            <p>No developers match your search.</p>
          </div>
        )}

        <div className="row g-3">
          {filtered.map((profile) => {
            const expStyle = EXP_STYLE[profile.experience_level] || {
              background: "#F2F5FC",
              color: "#8A9BBC",
            };
            const skills = Array.isArray(profile.skills) ? profile.skills : [];
            const fullName = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={profile.id} className="col-12 col-sm-6 col-lg-4">
                <div
                  onClick={() => navigate(`/profile/${profile.id}`)}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    border: "1px solid #D0DAEE",
                    padding: "20px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 6px 24px rgba(41,82,163,0.13)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 2px 12px rgba(0,0,0,0.07)")
                  }
                >
                  {/* Avatar + name */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: avatarColor(profile.id),
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      {(profile.user_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#1E2B4A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {fullName || profile.user_name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#8A9BBC" }}>
                        @{profile.user_name}
                      </div>
                    </div>
                    {profile.experience_level && (
                      <span
                        style={{
                          ...expStyle,
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          marginLeft: "auto",
                          flexShrink: 0,
                        }}
                      >
                        {profile.experience_level}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.82rem",
                        lineHeight: 1.5,
                        marginBottom: 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {profile.bio}
                    </p>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {skills.slice(0, 5).map((s) => (
                        <span
                          key={s}
                          style={{
                            background: "#E8EDF8",
                            color: "#4B6FCE",
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: "0.68rem",
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                      {skills.length > 5 && (
                        <span
                          style={{
                            color: "#8A9BBC",
                            fontSize: "0.68rem",
                            padding: "2px 4px",
                          }}
                        >
                          +{skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="d-flex justify-content-between align-items-center mt-auto pt-2"
                    style={{ borderTop: "1px solid #D0DAEE" }}
                  >
                    <small style={{ color: "#8A9BBC" }}>
                      {profile.availability
                        ? `${profile.availability} hrs/week`
                        : ""}
                    </small>
                    <div
                      className="d-flex gap-2 align-items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {profile.github_url && (
                        <a
                          href={profile.github_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#333", fontSize: "1.1rem" }}
                        >
                          <FaGithub />
                        </a>
                      )}
                      <button
                        onClick={() => navigate(`/profile/${profile.id}`)}
                        style={{
                          background: "#2952A3",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "4px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <FaUser size={10} /> View Profile
                      </button>
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
