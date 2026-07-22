import { useNavigate } from "react-router-dom";
import { FaCode, FaBolt, FaComments, FaSearch, FaGithub, FaArrowRight, FaCheckCircle, FaUsers, FaRocket, FaStar } from "react-icons/fa";

// ── Design tokens ──
const P     = "#2952A3";
const PLIGHT = "#EEF2FB";
const PDARK  = "#1E3D7A";
const TEXT   = "#1E2B4A";
const MUTED  = "#5E6E9A";
const BORDER = "#D0DAEE";

const DIAMOND_BG = {
  backgroundColor: "#EEF2FB",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: '80px 80px',
};

// ── App mockup shown in hero ──
function AppMockup() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 24px 64px rgba(41,82,163,0.18)",
      overflow: "hidden",
      border: "0.5px solid #D0DAEE",
      maxWidth: 360,
      width: "100%",
    }}>
      {/* Fake browser chrome */}
      <div style={{ background: "#EDF1F9", padding: "10px 14px", borderBottom: "0.5px solid #D0DAEE", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FCA5A5" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FDE68A" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6EE7B7" }} />
        <div style={{ flex: 1, background: "#D0DAEE", borderRadius: 4, height: 16, marginLeft: 8 }} />
      </div>

      {/* Fake navbar */}
      <div style={{ background: "#fff", padding: "10px 14px", borderBottom: "0.5px solid #D0DAEE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: TEXT }}>Dev<span style={{ color: P }}>Match</span></span>
        <div style={{ display: "flex", gap: 10 }}>
          {["Projects","Matches","Chats"].map(l => (
            <span key={l} style={{ fontSize: 9, color: MUTED, fontWeight: 500 }}>{l}</span>
          ))}
        </div>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#2952A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700 }}>A</div>
      </div>

      <div style={{ padding: 14 }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[["6","Projects",P], ["3","Chats","#10B981"], ["80%","Top Match","#F59E0B"]].map(([v, l, c]) => (
            <div key={l} style={{ background: "#2952A3"LIGHT, borderRadius: 8, padding: "8px 4px", textAlign: "center", border: `0.5px solid #D0DAEE` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 8, color: MUTED }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Match card */}
        <div style={{ background: "#2952A3"LIGHT, borderRadius: 10, padding: 10, marginBottom: 8, border: "0.5px solid #f5c6d8" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11, color: TEXT }}>AI Resume Builder</div>
              <div style={{ fontSize: 9, color: MUTED }}>by yousuf</div>
            </div>
            <div style={{ background: "#DCFCE7", color: "#15803D", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>80% match</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {["React","Python","Flask"].map(t => (
              <span key={t} style={{ background: "#D0DAEE", color: P, fontSize: 8, padding: "1px 6px", borderRadius: 4, fontWeight: 500 }}>{t}</span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#10B981", fontWeight: 600 }}>✓ React  ✓ Python</span>
            <button style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 5, padding: "3px 9px", fontSize: 9, fontWeight: 700 }}>Join</button>
          </div>
        </div>

        {/* Mini chat preview */}
        <div style={{ background: "#fff", borderRadius: 10, padding: 10, border: "0.5px solid #D0DAEE" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: P, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Team Chat</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#4B6FCE", flexShrink: 0 }} />
              <div style={{ background: "#F1F5F9", borderRadius: "8px 8px 8px 2px", padding: "4px 8px", fontSize: 9, color: TEXT, maxWidth: "80%" }}>just pushed the ML model 🚀</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", justifyContent: "flex-end" }}>
              <div style={{ background: "#2952A3", borderRadius: "8px 8px 2px 8px", padding: "4px 8px", fontSize: 9, color: "#fff", maxWidth: "80%" }}>nice! PR looks good 🔥</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature card ──
function FeatureCard({ icon, title, desc, color }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "28px 24px",
      boxShadow: "0 2px 16px rgba(41,82,163,0.07)",
      border: "0.5px solid #D0DAEE",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(41,82,163,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(41,82,163,0.07)"; }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + "18", color: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem", marginBottom: 16,
      }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: "1rem", color: TEXT, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: MUTED, fontSize: "0.875rem", lineHeight: 1.65, margin: 0 }}>{desc}</p>
    </div>
  );
}

// ── Step component ──
function Step({ num, title, desc }) {
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: `linear-gradient(135deg, ${P}, #4B6FCE)`,
        color: "#fff", fontWeight: 800, fontSize: "1rem",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: `0 4px 12px rgba(41,82,163,0.3)`,
      }}>{num}</div>
      <div>
        <h4 style={{ fontWeight: 700, color: TEXT, marginBottom: 4, fontSize: "0.95rem" }}>{title}</h4>
        <p style={{ color: MUTED, fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#fff", color: TEXT }}>

      {/* ────────── NAVBAR ────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "0.5px solid #D0DAEE",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: "1.25rem", color: TEXT, letterSpacing: "-0.01em" }}>
            Dev<span style={{ color: P }}>Match</span>
          </span>

          <div style={{ display: "flex", gap: 28 }} className="d-none d-md-flex">
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["About", "#stats"]].map(([label, href]) => (
              <a key={label} href={href} style={{ textDecoration: "none", color: MUTED, fontSize: "0.875rem", fontWeight: 500, transition: "color 0.15s" }}
                onMouseEnter={e => (e.target.style.color = P)} onMouseLeave={e => (e.target.style.color = MUTED)}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => navigate("/login")}
              style={{ background: "none", border: `1.5px solid ${BORDER}`, borderRadius: 8, padding: "7px 18px", fontSize: "0.85rem", fontWeight: 600, color: MUTED, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = P; e.currentTarget.style.color = P; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
            >Sign In</button>
            <button
              onClick={() => navigate("/register")}
              style={{ background: "#2952A3", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: "0.85rem", fontWeight: 700, color: "#fff", cursor: "pointer", transition: "background 0.15s", boxShadow: "0 2px 8px rgba(41,82,163,0.25)" }}
              onMouseEnter={e => (e.currentTarget.style.background = PDARK)}
              onMouseLeave={e => (e.currentTarget.style.background = P)}
            >Get Started →</button>
          </div>
        </div>
      </nav>

      {/* ────────── HERO ────────── */}
      <section style={{ ...DIAMOND_BG, padding: "80px 24px 100px", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: 64, flexWrap: "wrap" }}>

          {/* Left — copy */}
          <div style={{ flex: "1 1 420px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#D0DAEE", borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
              <FaBolt size={11} color={P} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: P }}>Skill-based developer matching</span>
            </div>

            <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.15, color: TEXT, marginBottom: 20, letterSpacing: "-0.02em" }}>
              Find the right{" "}
              <span style={{ color: P, position: "relative" }}>
                project.
                <span style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${P}, #4B6FCE)`, borderRadius: 2 }} />
              </span>
              <br />Build with the right team.
            </h1>

            <p style={{ fontSize: "1.05rem", color: MUTED, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
              DevMatch connects developers to open-source and collaborative projects based on real skill alignment — not just keywords. Join a team, contribute, and grow.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <button
                onClick={() => navigate("/register")}
                style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 10, padding: "13px 28px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(41,82,163,0.3)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = PDARK; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = P; e.currentTarget.style.transform = "none"; }}
              >
                Start for Free <FaArrowRight size={13} />
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{ background: "#fff", color: P, border: `1.5px solid ${P}`, borderRadius: 10, padding: "13px 28px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = PLIGHT)}
                onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
              >
                Sign In
              </button>
            </div>

            {/* Trust signals */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Free to join", "Skill matching", "Real-time chat", "Open projects"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <FaCheckCircle size={12} color="#10B981" />
                  <span style={{ fontSize: "0.8rem", color: MUTED, fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — app mockup */}
          <div style={{ flex: "1 1 320px", display: "flex", justifyContent: "center" }}>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ────────── STATS ────────── */}
      <section id="stats" style={{ background: "#2952A3", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
          {[
            { val: "500+", label: "Developers" },
            { val: "120+", label: "Active Projects" },
            { val: "4.9★", label: "Avg Rating" },
            { val: "Real-time", label: "Collaboration" },
          ].map(({ val, label }) => (
            <div key={label}>
              <div style={{ fontWeight: 800, fontSize: "2rem", color: "#fff", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── FEATURES ────────── */}
      <section id="features" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#2952A3"LIGHT, borderRadius: 20, padding: "5px 14px", marginBottom: 14 }}>
              <FaStar size={10} color={P} />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: P }}>Everything you need</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.25rem)", color: TEXT, marginBottom: 12, letterSpacing: "-0.02em" }}>
              Built for developers,<br />by developers
            </h2>
            <p style={{ color: MUTED, fontSize: "1rem", maxWidth: 540, margin: "0 auto" }}>
              Every feature is designed to reduce friction between finding a project and contributing to it.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            <FeatureCard icon={<FaBolt />} color={P} title="Skill-Based Matching"
              desc="Your skills are compared against project requirements. You see a match score, matched skills, and what you'd still need to learn — before you even apply." />
            <FeatureCard icon={<FaComments />} color="#4B6FCE" title="Real-Time Team Chat"
              desc="Every project has a built-in group chat. Messages, files, images — everything in one place. No switching to Slack or Discord just to coordinate." />
            <FeatureCard icon={<FaUsers />} color="#10B981" title="Project Management"
              desc="Create a project, review join requests, accept your team, and manage members all from one dashboard. Full control without the overhead." />
            <FeatureCard icon={<FaSearch />} color="#F59E0B" title="Smart Discovery"
              desc="Filter all projects by tech stack, urgency, paid/free, or search by description. Find exactly what you want to build in seconds." />
            <FeatureCard icon={<FaCode />} color="#EF4444" title="Developer Profiles"
              desc="Showcase your skills, experience level, GitHub, and bio. Your profile becomes your portfolio — visible to every project owner on the platform." />
            <FeatureCard icon={<FaRocket />} color="#0EA5E9" title="Instant Collaboration"
              desc="Once accepted, you're in. Chat opens immediately. No setup, no invites, no separate tools. You go from request to contributor in one click." />
          </div>
        </div>
      </section>

      {/* ────────── HOW IT WORKS ────────── */}
      <section id="how-it-works" style={{ ...DIAMOND_BG, padding: "96px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 64, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#D0DAEE", borderRadius: 20, padding: "5px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: P }}>Simple process</span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.1rem)", color: TEXT, marginBottom: 12, letterSpacing: "-0.02em" }}>
              From signup to collaborating in 3 steps
            </h2>
            <p style={{ color: MUTED, fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 32 }}>
              No tutorials needed. DevMatch is designed to get you building with others as fast as possible.
            </p>
            <button
              onClick={() => navigate("/register")}
              style={{ background: "#2952A3", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(41,82,163,0.25)" }}
            >
              Get Started Free <FaArrowRight size={12} />
            </button>
          </div>

          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 28 }}>
            <Step num="1" title="Create your profile"
              desc="Add your skills, experience level, GitHub link, and bio. This is what project owners and the matching algorithm use to evaluate fit." />
            <div style={{ width: 1, height: 28, background: "#D0DAEE", marginLeft: 19 }} />
            <Step num="2" title="Browse & match"
              desc="Go to Matches to see projects ranked by how well they fit your skills. Or explore all projects and filter by tech stack, urgency, or payment." />
            <div style={{ width: 1, height: 28, background: "#D0DAEE", marginLeft: 19 }} />
            <Step num="3" title="Join and collaborate"
              desc="Request to join a project. Once accepted, your team chat opens automatically. Start contributing immediately — no extra setup required." />
          </div>
        </div>
      </section>

      {/* ────────── CTA ────────── */}
      <section style={{ background: `linear-gradient(135deg, ${P} 0%, #4B6FCE 100%)`, padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.5rem)", color: "#fff", marginBottom: 12, letterSpacing: "-0.02em" }}>
          Ready to build something?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
          Join DevMatch and start collaborating on projects that actually match your skills.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/register")}
            style={{ background: "#fff", color: P, border: "none", borderRadius: 10, padding: "13px 32px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "transform 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "none")}
          >
            Create Free Account →
          </button>
          <button
            onClick={() => navigate("/projects")}
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "13px 28px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          >
            Browse Projects
          </button>
        </div>
      </section>

      {/* ────────── FOOTER ────────── */}
      <footer style={{ background: "#0F1B35", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", marginBottom: 8 }}>
            Dev<span style={{ color: "#A0B3DF" }}>Match</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: 16 }}>
            Connecting developers to projects that match their skills.
          </p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {[["Sign In", "/login"], ["Register", "/register"], ["Projects", "/projects"], ["Matches", "/matches"]].map(([l, path]) => (
              <a key={l} href={path} style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => (e.target.style.color = "#A0B3DF")} onMouseLeave={e => (e.target.style.color = "rgba(255,255,255,0.4)")}>
                {l}
              </a>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", marginTop: 24, marginBottom: 0 }}>
            © 2025 DevMatch. Built with React, Flask & PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}
