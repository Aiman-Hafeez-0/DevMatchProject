import { useEffect, useState, useMemo } from "react";
import ProjectCard from "./ProjectCard";
import { FaSearch, FaTimes, FaLayerGroup, FaThLarge } from "react-icons/fa";
import { API_URL } from "../config";

const BG = {
  backgroundColor: '#EEF2FB',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: '80px 80px',
  minHeight: '100vh',
  padding: '32px 20px',
};

const URGENCY_OPTIONS = ['All', 'High', 'Moderate', 'Low'];
const PAID_OPTIONS    = ['All', 'Paid', 'Free'];

const URGENCY_PILL = {
  High:     { active: { background: '#e53e3e', color: '#fff' }, idle: { background: '#FEF2F2', color: '#e53e3e', border: '1px solid #fed7d7' } },
  Moderate: { active: { background: '#d97706', color: '#fff' }, idle: { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' } },
  Low:      { active: { background: '#16a34a', color: '#fff' }, idle: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' } },
};

export default function AllProjects() {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [search, setSearch]           = useState("");
  const [urgencyFilter, setUrgency]   = useState("All");
  const [paidFilter, setPaid]         = useState("All");
  const [techFilter, setTechFilter]   = useState("");
  const [viewMode, setViewMode]       = useState("list"); // 'list' | 'grid'

  useEffect(() => {
    fetch(`${API_URL}/projects/all`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setProjects(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Extract all unique tech tags for the tech filter strip
  const allTechs = useMemo(() => {
    const counts = {};
    projects.forEach((p) => {
      const ts = Array.isArray(p.tech_stack)
        ? p.tech_stack
        : (p.tech_stack || '').replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
      ts.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([t]) => t);
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((p) => {
      const ts = Array.isArray(p.tech_stack)
        ? p.tech_stack
        : (p.tech_stack || '').replace(/[{}"]/g, '').split(',').map(s => s.trim());

      if (q && !p.title?.toLowerCase().includes(q) &&
               !p.description?.toLowerCase().includes(q) &&
               !ts.some(t => t.toLowerCase().includes(q))) return false;
      if (urgencyFilter !== 'All' && p.urgency !== urgencyFilter) return false;
      if (paidFilter === 'Paid' && !p.is_paid) return false;
      if (paidFilter === 'Free' && p.is_paid)  return false;
      if (techFilter && !ts.map(t => t.toLowerCase()).includes(techFilter.toLowerCase())) return false;
      return true;
    });
  }, [projects, search, urgencyFilter, paidFilter, techFilter]);

  const activeFilters = [urgencyFilter !== 'All', paidFilter !== 'All', !!techFilter, !!search.trim()].filter(Boolean).length;

  const clearAll = () => { setSearch(''); setUrgency('All'); setPaid('All'); setTechFilter(''); };

  if (loading) return (
    <div style={{ ...BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: '#2952A3' }} />
    </div>
  );

  return (
    <div style={BG}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
          <div>
            <h3 style={{ fontWeight: 700, color: '#1E2B4A', marginBottom: 4 }}>Explore Projects</h3>
            <p style={{ color: '#8A9BBC', marginBottom: 0 }}>
              <span style={{ fontWeight: 700, color: '#2952A3' }}>{filtered.length}</span>
              {' '}of {projects.length} projects
              {activeFilters > 0 && (
                <button
                  onClick={clearAll}
                  style={{ background: 'none', border: 'none', color: '#8A9BBC', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 8, textDecoration: 'underline' }}
                >
                  Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                </button>
              )}
            </p>
          </div>

          {/* View toggle */}
          <div style={{
            display: 'flex', background: '#fff', borderRadius: 10, padding: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {[
              { mode: 'list', icon: <FaLayerGroup size={13} /> },
              { mode: 'grid', icon: <FaThLarge size={13} />    },
            ].map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  border: 'none', borderRadius: 8, padding: '7px 12px',
                  background: viewMode === mode ? '#2952A3' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#8B9CC2',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Search + filters card */}
        <div style={{
          background: '#fff', borderRadius: 14,
          boxShadow: '0 2px 12px rgba(41,82,163,0.07)',
          padding: '16px 18px', marginBottom: 20,
        }}>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <FaSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#ccc', fontSize: '0.85rem' }} />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, tech stack, or description..."
              style={{
                width: '100%', padding: '11px 36px 11px 38px',
                border: '1.5px solid #D0DAEE', borderRadius: 10,
                fontSize: '0.88rem', outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2952A3')}
              onBlur={(e) => (e.target.style.borderColor = '#D0DAEE')}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#bbb', cursor: 'pointer' }}>
                <FaTimes size={13} />
              </button>
            )}
          </div>

          {/* Filter pills row */}
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {/* Urgency */}
            <div className="d-flex gap-1">
              {URGENCY_OPTIONS.map((u) => {
                const isActive = urgencyFilter === u;
                const style = u === 'All'
                  ? isActive
                    ? { background: '#1E2B4A', color: '#fff' }
                    : { background: '#EDF1F9', color: '#666', border: '0.5px solid #D0DAEE' }
                  : isActive ? URGENCY_PILL[u]?.active : URGENCY_PILL[u]?.idle;
                return (
                  <button key={u} onClick={() => setUrgency(u)} style={{
                    ...style, border: style?.border || 'none',
                    borderRadius: 20, padding: '5px 12px', fontSize: '0.75rem',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {u === 'All' ? 'Any urgency' : u}
                  </button>
                );
              })}
            </div>

            <div style={{ width: 1, height: 20, background: '#D0DAEE' }} />

            {/* Paid/Free */}
            <div className="d-flex gap-1">
              {PAID_OPTIONS.map((p) => {
                const isActive = paidFilter === p;
                return (
                  <button key={p} onClick={() => setPaid(p)} style={{
                    background: isActive ? '#2952A3' : '#EDF1F9',
                    color: isActive ? '#fff' : '#7A8BB0',
                    border: isActive ? 'none' : '1px solid #e5e5e5',
                    borderRadius: 20, padding: '5px 12px', fontSize: '0.75rem',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {p === 'All' ? 'Paid or free' : p === 'Paid' ? '💰 Paid' : '🆓 Free'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tech filter chips */}
          {allTechs.length > 0 && (
            <div className="d-flex flex-wrap gap-1 mt-3 pt-3" style={{ borderTop: '1px solid #EEF2FB' }}>
              <span style={{ fontSize: '0.72rem', color: '#8A9BBC', alignSelf: 'center', marginRight: 4 }}>Tech:</span>
              {allTechs.map((t) => {
                const isActive = techFilter === t;
                return (
                  <button key={t} onClick={() => setTechFilter(isActive ? '' : t)} style={{
                    background: isActive ? '#2952A3' : '#EEF2FB',
                    color: isActive ? '#fff' : '#2952A3',
                    border: isActive ? 'none' : '0.5px solid #f5c6d8',
                    borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem',
                    fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {isActive && '✓ '}{t}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Empty state */}
        {!error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <p style={{ color: '#8A9BBC', marginBottom: 12 }}>No projects match your filters.</p>
            <button className="btn btn-sm" style={{ background: '#2952A3', color: '#fff', border: 'none', borderRadius: 8 }}
              onClick={clearAll}>
              Clear all filters
            </button>
          </div>
        )}

        {/* Project cards */}
        <div className={viewMode === 'grid' ? 'row g-3' : 'd-flex flex-column gap-3'}>
          {filtered.map((project) => (
            <div key={project.id} className={viewMode === 'grid' ? 'col-12 col-md-6' : undefined}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
