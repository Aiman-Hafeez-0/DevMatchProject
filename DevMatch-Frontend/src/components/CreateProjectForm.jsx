import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaGithub, FaRocket } from "react-icons/fa";
import { API_URL } from "../config";

const SUGGESTED_TECH = [
  "React","Vue","Angular","Next.js","TypeScript","JavaScript",
  "Python","Flask","Django","FastAPI","Node.js","Express",
  "PostgreSQL","MySQL","MongoDB","Redis",
  "Docker","AWS","Git","REST API","GraphQL",
  "Machine Learning","TensorFlow","PyTorch",
];

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1.5px solid #D0DAEE", borderRadius: 10,
  fontSize: "0.88rem", outline: "none", transition: "border 0.2s",
  background: "#fff",
};
const labelStyle = {
  fontSize: "0.82rem", fontWeight: 600, color: "#4A5B7A",
  marginBottom: 5, display: "block",
};
const sectionStyle = {
  background: "#fff", borderRadius: 14, padding: "22px 22px",
  marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};
const sectionTitle = {
  fontWeight: 700, color: "#2952A3", marginBottom: 16,
  textTransform: "uppercase", fontSize: "0.72rem", letterSpacing: 0.8,
};

export default function CreateProjectForm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [techInput, setTechInput] = useState("");

  const [formData, setFormData] = useState({
    title: "", description: "",
    tech_stack: [],
    github_repo: "", urgency: "",
    is_private: false, is_paid: false,
    problem_statements: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const addTech = (tech) => {
    const t = tech.trim();
    if (!t) return;
    if (formData.tech_stack.map(x => x.toLowerCase()).includes(t.toLowerCase())) return;
    setFormData((p) => ({ ...p, tech_stack: [...p.tech_stack, t] }));
    setTechInput("");
  };

  const removeTech = (tech) => {
    setFormData((p) => ({ ...p, tech_stack: p.tech_stack.filter(t => t !== tech) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.warning("Project title is required"); return; }
    if (formData.tech_stack.length === 0) { toast.warning("Add at least one technology"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          problem_statements: formData.problem_statements
            .split(",").map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Project created!");
        navigate("/owner/projects");
      } else {
        toast.warning(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Server error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const focusIn  = (e) => (e.target.style.borderColor = "#2952A3");
  const focusOut = (e) => (e.target.style.borderColor = "#D0DAEE");

  return (
    <div style={{
      backgroundColor: "#EEF2FB",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
      backgroundSize: '80px 80px',
      minHeight: "100vh", padding: "32px 16px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 52, height: 52, borderRadius: "50%",
            background: "#2952A3", color: "#fff", fontSize: "1.3rem", marginBottom: 10,
            boxShadow: "0 4px 16px rgba(41,82,163,0.3)",
          }}>
            <FaRocket />
          </div>
          <h3 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 4 }}>Start a New Project</h3>
          <p style={{ color: "#8A9BBC", fontSize: "0.85rem" }}>
            Publish your project and find the right collaborators
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div style={sectionStyle}>
            <h6 style={sectionTitle}>📋 Basic Information</h6>

            <div className="mb-3">
              <label style={labelStyle}>Project Title *</label>
              <input style={inputStyle} name="title" value={formData.title}
                onChange={handleChange} onFocus={focusIn} onBlur={focusOut}
                placeholder="e.g. AI-Powered Resume Builder" required />
            </div>

            <div className="mb-0">
              <label style={labelStyle}>Description *</label>
              <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }}
                name="description" value={formData.description}
                onChange={handleChange} onFocus={focusIn} onBlur={focusOut}
                placeholder="What are you building? What problem does it solve?"
                required />
              <p style={{ fontSize: "0.72rem", color: "#bbb", marginTop: 4, marginBottom: 0 }}>
                {formData.description.length} chars
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div style={sectionStyle}>
            <h6 style={sectionTitle}>⚙️ Tech Stack *</h6>

            <div
              style={{
                display: "flex", flexWrap: "wrap", gap: 6,
                padding: "10px 12px", border: "1.5px solid #D0DAEE",
                borderRadius: 10, minHeight: 50, background: "#F2F5FC", marginBottom: 8,
              }}
            >
              {formData.tech_stack.map((t) => (
                <span key={t} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#E8EDF8", color: "#4B6FCE",
                  border: "1px solid #C7D3EE",
                  borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 500,
                }}>
                  {t}
                  <button type="button" onClick={() => removeTech(t)}
                    style={{ background: "none", border: "none", color: "#4B6FCE", cursor: "pointer", padding: 0, lineHeight: 1 }}>
                    <FaTimes size={10} />
                  </button>
                </span>
              ))}
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTech(techInput); }}}
                placeholder={formData.tech_stack.length === 0 ? "Type a tech and press Enter..." : "Add more..."}
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", minWidth: 140, flex: 1 }}
              />
            </div>
            <p style={{ fontSize: "0.72rem", color: "#8A9BBC", margin: "0 0 8px" }}>
              Press Enter or comma to add · Click × to remove
            </p>

            {/* Suggestions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {SUGGESTED_TECH
                .filter(t => !formData.tech_stack.map(x => x.toLowerCase()).includes(t.toLowerCase()))
                .slice(0, 12).map((t) => (
                <button key={t} type="button" onClick={() => addTech(t)}
                  style={{ background: "#F2F5FC", color: "#8A9BBC", border: "1px solid #e5e5e5", borderRadius: 20, padding: "2px 10px", fontSize: "0.72rem", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#E8EDF8"; e.currentTarget.style.color = "#4B6FCE"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#F2F5FC"; e.currentTarget.style.color = "#7A8BB0"; }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div style={sectionStyle}>
            <h6 style={sectionTitle}>🔧 Project Details</h6>

            <div className="mb-3">
              <label style={labelStyle}><FaGithub style={{ marginRight: 5 }} />GitHub Repository (optional)</label>
              <input type="url" style={inputStyle} name="github_repo" value={formData.github_repo}
                onChange={handleChange} onFocus={focusIn} onBlur={focusOut}
                placeholder="https://github.com/you/project" />
            </div>

            <div className="mb-0">
              <label style={labelStyle}>Problem Statements <span style={{ fontWeight: 400, color: "#8A9BBC" }}>(optional, comma-separated)</span></label>
              <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }}
                name="problem_statements" value={formData.problem_statements}
                onChange={handleChange} onFocus={focusIn} onBlur={focusOut}
                placeholder="e.g. Manual resume writing is time-consuming, Lack of ATS optimisation" />
            </div>
          </div>

          {/* Preferences */}
          <div style={sectionStyle}>
            <h6 style={sectionTitle}>⚡ Preferences</h6>

            <div className="mb-3">
              <label style={labelStyle}>Urgency</label>
              <select style={{ ...inputStyle, background: "#fff" }} name="urgency"
                value={formData.urgency} onChange={handleChange} onFocus={focusIn} onBlur={focusOut}>
                <option value="">-- Select urgency --</option>
                <option value="Low">🟢 Low — no rush</option>
                <option value="Moderate">🟡 Moderate — a few weeks</option>
                <option value="High">🔴 High — urgent</option>
              </select>
            </div>

            <div className="d-flex gap-4">
              {[
                { name: "is_paid", label: "💰 Paid Project", desc: "Collaborators will be compensated" },
                { name: "is_private", label: "🔒 Private Project", desc: "Only visible to invited members" },
              ].map(({ name, label, desc }) => (
                <label key={name} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  cursor: "pointer", flex: 1,
                  padding: "12px", borderRadius: 10,
                  border: formData[name] ? "1.5px solid #2952A3" : "1.5px solid #D0DAEE",
                  background: formData[name] ? "#EEF2FB" : "#F2F5FC",
                  transition: "all 0.15s",
                }}>
                  <input type="checkbox" name={name} checked={!!formData[name]}
                    onChange={handleChange} style={{ marginTop: 2, accentColor: "#2952A3" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1E2B4A" }}>{label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#8A9BBC" }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} style={{
            width: "100%", padding: "13px",
            background: saving ? "#8BA7D4" : "#2952A3",
            color: "#fff", border: "none", borderRadius: 12,
            fontWeight: 700, fontSize: "1rem",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(41,82,163,0.3)",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving ? "Creating..." : <><FaRocket /> Create Project</>}
          </button>
        </form>
      </div>
    </div>
  );
}
