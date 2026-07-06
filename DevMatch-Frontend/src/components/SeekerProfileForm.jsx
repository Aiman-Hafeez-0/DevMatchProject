import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { FaGithub, FaTimes } from "react-icons/fa";

const SUGGESTED_SKILLS = [
  "React",
  "Vue",
  "Angular",
  "Next.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "Flask",
  "Django",
  "FastAPI",
  "Node.js",
  "Express",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Docker",
  "AWS",
  "Git",
  "REST API",
  "GraphQL",
  "Machine Learning",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
];

export default function SeekerProfileForm() {
  const { updateSession } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    skills: [],
    experience_level: "",
    github_url: "",
    availability: "",
    bio: "",
  });

  useEffect(() => {
    fetch("http://localhost:5000/profiles/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const rawSkills = data.skills;
        let skills = [];
        if (Array.isArray(rawSkills)) skills = rawSkills;
        else if (typeof rawSkills === "string")
          skills = rawSkills
            .replace(/[{}"]/g, "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        setFormData({
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          skills,
          experience_level: data.experience_level || "",
          github_url: data.github_url || "",
          availability: data.availability || "",
          bio: data.bio || "",
        });
        setIsEditing(true);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s) return;
    if (formData.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase()))
      return;
    setFormData((p) => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setFormData((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.skills.length === 0) {
      toast.warning("Please add at least one skill");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/profiles/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Profile updated!");
        await updateSession();
        navigate("/dashboard");
      } else {
        const d = await res.json();
        toast.error(d.error || "Something went wrong");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #D0DAEE",
    borderRadius: 10,
    fontSize: "0.88rem",
    outline: "none",
    transition: "border 0.2s",
  };
  const focusStyle = (e) => (e.target.style.borderColor = "#2952A3");
  const blurStyle = (e) => (e.target.style.borderColor = "#D0DAEE");
  const labelStyle = {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#4A5B7A",
    marginBottom: 5,
    display: "block",
  };

  return (
    <div
      style={{
        backgroundColor: "#EEF2FB",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
        backgroundSize: "80px 80px",
        minHeight: "100vh",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#2952A3",
              color: "#fff",
              fontSize: "1.3rem",
              marginBottom: 10,
              boxShadow: "0 4px 16px rgba(41,82,163,0.3)",
            }}
          >
            🎯
          </div>
          <h3 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 4 }}>
            {isEditing ? "Edit Your Profile" : "Complete Your Profile"}
          </h3>
          <p style={{ color: "#8A9BBC", fontSize: "0.85rem" }}>
            {isEditing
              ? "Keep your info up to date"
              : "Set up your profile to start matching with projects"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "24px 22px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 16,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
              }}
            >
              Personal Information
            </h6>

            <div className="mb-3">
              <label style={labelStyle}>Username</label>
              <input
                style={inputStyle}
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="yourhandle"
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label style={labelStyle}>First Name</label>
                <input
                  style={inputStyle}
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Aiman"
                  required
                />
              </div>
              <div className="col-6">
                <label style={labelStyle}>Last Name</label>
                <input
                  style={inputStyle}
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Siddiqui"
                  required
                />
              </div>
            </div>

            <div className="mb-0">
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                style={inputStyle}
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "24px 22px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 16,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
              }}
            >
              Skills & Experience
            </h6>

            {/* Skill chips */}
            <div className="mb-3">
              <label style={labelStyle}>Your Skills</label>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "10px 12px",
                  border: "1.5px solid #D0DAEE",
                  borderRadius: 10,
                  minHeight: 48,
                  background: "#F2F5FC",
                  marginBottom: 8,
                }}
              >
                {formData.skills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "#E8EDF8",
                      color: "#4B6FCE",
                      border: "1px solid #C7D3EE",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                    }}
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4B6FCE",
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder={
                    formData.skills.length === 0
                      ? "Type a skill and press Enter..."
                      : "Add more..."
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.85rem",
                    minWidth: 140,
                    flex: 1,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "#8A9BBC",
                  margin: "0 0 8px",
                }}
              >
                Press Enter or comma to add · Click × to remove
              </p>

              {/* Suggested skills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SUGGESTED_SKILLS.filter(
                  (s) =>
                    !formData.skills
                      .map((x) => x.toLowerCase())
                      .includes(s.toLowerCase()),
                )
                  .slice(0, 12)
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      style={{
                        background: "#F2F5FC",
                        color: "#8A9BBC",
                        border: "1px solid #e5e5e5",
                        borderRadius: 20,
                        padding: "2px 10px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#E8EDF8";
                        e.currentTarget.style.color = "#4B6FCE";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#F2F5FC";
                        e.currentTarget.style.color = "#7A8BB0";
                      }}
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            </div>

            <div className="mb-0">
              <label style={labelStyle}>Experience Level</label>
              <select
                style={{ ...inputStyle, background: "#fff" }}
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                required
              >
                <option value="">-- Select level --</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Preferences */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "24px 22px",
              marginBottom: 16,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 16,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
              }}
            >
              Work Preferences
            </h6>

            <div className="mb-3">
              <label style={labelStyle}>
                <FaGithub style={{ marginRight: 5 }} />
                GitHub URL
              </label>
              <input
                type="url"
                style={inputStyle}
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div className="mb-0">
              <label style={labelStyle}>Availability</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min="1"
                  max="80"
                  style={{ ...inputStyle, flex: 1 }}
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="e.g. 10"
                />
                <span
                  style={{
                    color: "#8A9BBC",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  hrs / week
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "24px 22px",
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <h6
              style={{
                fontWeight: 700,
                color: "#2952A3",
                marginBottom: 16,
                textTransform: "uppercase",
                fontSize: "0.72rem",
                letterSpacing: 0.8,
              }}
            >
              About You
            </h6>
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder="Tell other developers who you are, what you love building, and what you're looking for..."
            />
            <p
              style={{
                fontSize: "0.72rem",
                color: "#bbb",
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              {formData.bio.length} / 500 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "13px",
              background: saving ? "#f0c0d0" : "#2952A3",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "1rem",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(41,82,163,0.3)",
              transition: "all 0.2s",
            }}
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
