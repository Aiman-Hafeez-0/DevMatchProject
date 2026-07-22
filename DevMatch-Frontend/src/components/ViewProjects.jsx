import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaComments, FaUsers, FaGithub, FaClock, FaMoneyBillWave, FaUserPlus } from 'react-icons/fa';
import { API_URL } from "../config";

const BG = {
  backgroundColor: '#EEF2FB',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
  backgroundSize: '80px 80px',
  minHeight: '100vh',
  padding: '32px 20px',
};

const URGENCY = {
  High:     { background: '#FEF2F2', color: '#e53e3e', border: '1px solid #fed7d7' },
  Moderate: { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  Low:      { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
};

const parseTech = (ts) => {
  if (Array.isArray(ts)) return ts;
  if (typeof ts === 'string') return ts.replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

export default function ViewProjects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab === 'joined' ? 'joined' : initialTab === 'requests' ? 'requests' : 'owned'
  );
  const [projects, setProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPendingRequests = () => {
    setRequestsLoading(true);
    fetch(`${API_URL}/projects/pending-requests`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setPendingRequests(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load pending requests'))
      .finally(() => setRequestsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'requests') fetchPendingRequests();
  }, [activeTab]);

  const handleAcceptRequest = async (projectId, userId) => {
    setProcessingRequestId(`${projectId}-${userId}`);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/accept/${userId}`, {
        method: 'PUT', credentials: 'include',
      });
      if (res.ok) {
        toast.success('Request accepted!');
        setPendingRequests(prev => prev.filter(r => !(r.project_id === projectId && r.user_id === userId)));
      } else {
        const d = await res.json();
        toast.error(d.error || 'Could not accept request');
      }
    } catch { toast.error('Server error'); }
    finally { setProcessingRequestId(null); }
  };

  const handleRejectRequest = async (projectId, userId) => {
    setProcessingRequestId(`${projectId}-${userId}`);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}/reject/${userId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) {
        toast.info('Request rejected');
        setPendingRequests(prev => prev.filter(r => !(r.project_id === projectId && r.user_id === userId)));
      } else {
        const d = await res.json();
        toast.error(d.error || 'Could not reject request');
      }
    } catch { toast.error('Server error'); }
    finally { setProcessingRequestId(null); }
  };

  // ── Invite-by-username modal ──
  const [invitingProject, setInvitingProject] = useState(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteSending, setInviteSending] = useState(false);

  const openInvite = (project) => {
    setInvitingProject(project);
    setInviteUsername('');
  };

  const sendInvite = async () => {
    if (!inviteUsername.trim()) { toast.warning('Enter a username'); return; }
    setInviteSending(true);
    try {
      const res = await fetch(`${API_URL}/projects/${invitingProject.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: inviteUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Invitation sent!');
        setInvitingProject(null);
      } else {
        toast.error(data.error || 'Could not send invite');
      }
    } catch { toast.error('Server error'); }
    finally { setInviteSending(false); }
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/projects/my-projects`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/projects/joined-projects`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : []),
    ])
      .then(([owned, joined]) => {
        setProjects(Array.isArray(owned) ? owned : []);
        setJoinedProjects(Array.isArray(joined) ? joined : []);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (project) => {
    setEditingProject(project);
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      tech_stack: parseTech(project.tech_stack).join(', '),
      github_repo: project.github_repo || '',
      urgency: project.urgency || '',
      is_paid: project.is_paid || false,
      is_private: project.is_private || false,
      problem_statements: parseTech(project.problem_statements), // array, same parser as tech_stack
    });
    setNewStatement('');
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Problem statement chip management ──
  const [newStatement, setNewStatement] = useState('');

  const addProblemStatement = () => {
    const s = newStatement.trim();
    if (!s) return;
    setEditForm(prev => ({ ...prev, problem_statements: [...(prev.problem_statements || []), s] }));
    setNewStatement('');
  };

  const removeProblemStatement = (index) => {
    setEditForm(prev => ({
      ...prev,
      problem_statements: prev.problem_statements.filter((_, i) => i !== index),
    }));
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        tech_stack: editForm.tech_stack.split(',').map(s => s.trim()).filter(Boolean),
        problem_statements: editForm.problem_statements, // already an array
      };
      const res = await fetch(`${API_URL}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Project updated!');
        setProjects(prev => prev.map(p =>
          p.id === editingProject.id ? { ...p, ...payload, tech_stack: payload.tech_stack } : p
        ));
        setEditingProject(null);
      } else {
        const d = await res.json();
        toast.error(d.error || 'Update failed');
      }
    } catch { toast.error('Server error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (projectId, projectTitle) => {
    if (!window.confirm(`Delete "${projectTitle}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Project deleted');
        setProjects(prev => prev.filter(p => p.id !== projectId));
      } else {
        const d = await res.json();
        toast.error(d.error || 'Delete failed');
      }
    } catch { toast.error('Server error'); }
    finally { setDeletingId(null); }
  };

  if (loading) return (
    <div style={{ ...BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-border" style={{ color: '#2952A3' }} />
    </div>
  );

  return (
    <div style={BG}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 style={{ fontWeight: 700, color: '#1E2B4A', marginBottom: 4 }}>My Projects</h3>
            <p style={{ color: '#8A9BBC', marginBottom: 0 }}>
              {activeTab === 'owned'
                ? `${projects.length} project${projects.length !== 1 ? 's' : ''} you own`
                : `${joinedProjects.length} project${joinedProjects.length !== 1 ? 's' : ''} you've joined`}
            </p>
          </div>
          <button
            className="btn"
            style={{ background: '#2952A3', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600 }}
            onClick={() => navigate('/create-project')}
          >
            + New Project
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, background: '#fff',
          borderRadius: 12, padding: 4, marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content',
        }}>
          {[
            { key: 'owned',    label: `🚀 Created (${projects.length})`        },
            { key: 'joined',   label: `🤝 Joined (${joinedProjects.length})`   },
            { key: 'requests', label: `⏳ Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                border: 'none', borderRadius: 9, padding: '8px 20px',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                background: activeTab === key ? '#2952A3' : 'transparent',
                color: activeTab === key ? '#fff' : '#7A8BB0',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {activeTab === 'owned' && projects.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚀</div>
            <p style={{ color: '#8A9BBC', marginBottom: 16 }}>You haven't created any projects yet.</p>
            <button
              className="btn"
              style={{ background: '#2952A3', color: '#fff', border: 'none', borderRadius: 8 }}
              onClick={() => navigate('/create-project')}
            >
              Create your first project
            </button>
          </div>
        )}

        {activeTab === 'joined' && joinedProjects.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🤝</div>
            <p style={{ color: '#8A9BBC', marginBottom: 16 }}>You haven't joined any projects yet.</p>
            <button
              className="btn"
              style={{ background: '#2952A3', color: '#fff', border: 'none', borderRadius: 8 }}
              onClick={() => navigate('/projects')}
            >
              Browse Projects
            </button>
          </div>
        )}

        {/* Owned projects */}
        {activeTab === 'owned' && (
          <div className="d-flex flex-column gap-3">
            {projects.map(project => {
            const techStack = parseTech(project.tech_stack);
            const urgencyStyle = URGENCY[project.urgency] || {};

            return (
              <div
                key={project.id}
                style={{
                  background: '#fff', borderRadius: 14,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  border: '1px solid #D0DAEE', padding: '20px 24px',
                }}
              >
                {/* Top row */}
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div style={{ minWidth: 0 }}>
                    <h5
                      style={{ fontWeight: 700, color: '#1E2B4A', marginBottom: 2, cursor: 'pointer' }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      {project.title}
                    </h5>
                    <small style={{ color: '#bbb' }}>
                      Created {new Date(project.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </small>
                  </div>

                  {/* Badges */}
                  <div className="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">
                    {project.urgency && (
                      <span style={{ ...urgencyStyle, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                        <FaClock size={10} style={{ marginRight: 4 }} />{project.urgency}
                      </span>
                    )}
                    {project.is_paid && (
                      <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                        <FaMoneyBillWave size={10} style={{ marginRight: 4 }} />Paid
                      </span>
                    )}
                    {project.is_private && (
                      <span style={{ background: '#F2F5FC', color: '#8A9BBC', border: '1px solid #e0e0e0', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                        🔒 Private
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  color: '#4A5B7A', fontSize: '0.875rem', marginBottom: 12, lineHeight: 1.55,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {project.description || 'No description provided.'}
                </p>

                {/* Tech stack */}
                {techStack.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {techStack.slice(0, 6).map(tech => (
                      <span key={tech} style={{
                        background: '#E8EDF8', color: '#4B6FCE',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 500,
                      }}>
                        {tech}
                      </span>
                    ))}
                    {techStack.length > 6 && <span style={{ color: '#8A9BBC', fontSize: '0.72rem' }}>+{techStack.length - 6} more</span>}
                  </div>
                )}

                {/* Action row */}
                <div className="d-flex gap-2 flex-wrap align-items-center" style={{ borderTop: '1px solid #D0DAEE', paddingTop: 12 }}>
                  {project.github_repo && (
                    <a href={project.github_repo} target="_blank" rel="noreferrer"
                      style={{ color: '#4A5B7A', fontSize: '1.1rem', marginRight: 4 }} title="GitHub repo">
                      <FaGithub />
                    </a>
                  )}

                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: '#f0f8ff', color: '#0EA5E9', border: '1px solid #bae6fd', borderRadius: 8, fontSize: '0.78rem' }}
                    onClick={() => navigate(`/chat/project/${project.id}`)}
                    title="Open team chat"
                  >
                    <FaComments size={11} /> Chat
                  </button>

                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.78rem' }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    title="View project details & members"
                  >
                    <FaUsers size={11} /> Members
                  </button>

                  <button
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{
                      background: project.is_private ? '#EEF2FB' : '#F2F5FC',
                      color: '#2952A3',
                      border: project.is_private ? '1.5px solid #2952A3' : '1px solid #C7D3EE',
                      borderRadius: 8, fontSize: '0.78rem', fontWeight: project.is_private ? 700 : 500,
                    }}
                    onClick={() => openInvite(project)}
                    title={project.is_private ? "Invite someone — required for private projects" : "Invite someone directly"}
                  >
                    <FaUserPlus size={11} /> Invite
                  </button>

                  <div className="ms-auto d-flex gap-2">
                    <button
                      className="btn btn-sm d-flex align-items-center gap-1"
                      style={{ background: '#fff8e1', color: '#d97706', border: '1px solid #fde68a', borderRadius: 8, fontSize: '0.78rem' }}
                      onClick={() => openEdit(project)}
                    >
                      <FaEdit size={11} /> Edit
                    </button>
                    <button
                      className="btn btn-sm d-flex align-items-center gap-1"
                      disabled={deletingId === project.id}
                      style={{ background: '#FEF2F2', color: '#e53e3e', border: '1px solid #fed7d7', borderRadius: 8, fontSize: '0.78rem' }}
                      onClick={() => handleDelete(project.id, project.title)}
                    >
                      {deletingId === project.id
                        ? <span className="spinner-border spinner-border-sm" />
                        : <><FaTrash size={11} /> Delete</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Joined projects tab */}
        {activeTab === 'joined' && joinedProjects.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {joinedProjects.map(project => {
              const techStack = parseTech(project.tech_stack);
              const urgencyStyle = URGENCY[project.urgency] || {};
              return (
                <div
                  key={project.id}
                  style={{
                    background: '#fff', borderRadius: 14,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    border: '1px solid #D0DAEE', padding: '20px 24px',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <h5
                        style={{ fontWeight: 700, color: '#1E2B4A', marginBottom: 2, cursor: 'pointer' }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        {project.title}
                      </h5>
                      <small style={{ color: '#8A9BBC' }}>
                        by {project.owner_name} · Joined {new Date(project.joined_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </small>
                    </div>
                    <div className="d-flex gap-2 flex-shrink-0 flex-wrap justify-content-end">
                      {project.urgency && (
                        <span style={{ ...urgencyStyle, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                          <FaClock size={10} style={{ marginRight: 4 }} />{project.urgency}
                        </span>
                      )}
                      {project.is_paid && (
                        <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600 }}>
                          <FaMoneyBillWave size={10} style={{ marginRight: 4 }} />Paid
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{
                    color: '#4A5B7A', fontSize: '0.875rem', marginBottom: 12, lineHeight: 1.55,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {project.description || 'No description provided.'}
                  </p>

                  {techStack.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-3">
                      {techStack.slice(0, 6).map(tech => (
                        <span key={tech} style={{ background: '#E8EDF8', color: '#4B6FCE', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 500 }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-2 align-items-center" style={{ borderTop: '1px solid #D0DAEE', paddingTop: 12 }}>
                    {project.github_repo && (
                      <a href={project.github_repo} target="_blank" rel="noreferrer" style={{ color: '#4A5B7A', fontSize: '1.1rem', marginRight: 4 }}>
                        <FaGithub />
                      </a>
                    )}
                    <button
                      className="btn btn-sm d-flex align-items-center gap-1"
                      style={{ background: '#f0f8ff', color: '#0EA5E9', border: '1px solid #bae6fd', borderRadius: 8, fontSize: '0.78rem' }}
                      onClick={() => navigate(`/chat/project/${project.id}`)}
                    >
                      <FaComments size={11} /> Chat
                    </button>
                    <button
                      className="btn btn-sm d-flex align-items-center gap-1"
                      style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: '0.78rem' }}
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <FaUsers size={11} /> Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending requests tab */}
        {activeTab === 'requests' && requestsLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner-border" style={{ color: '#2952A3' }} />
          </div>
        )}

        {activeTab === 'requests' && !requestsLoading && pendingRequests.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(41,82,163,0.06)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
            <p style={{ color: '#7A8BB0', marginBottom: 0 }}>No pending requests right now.</p>
            <p style={{ color: '#A6B3CF', fontSize: '0.82rem', marginTop: 4 }}>
              When someone requests to join one of your projects, it'll show up here.
            </p>
          </div>
        )}

        {activeTab === 'requests' && !requestsLoading && pendingRequests.length > 0 && (
          <div className="d-flex flex-column gap-3">
            {pendingRequests.map((req) => {
              const isProcessing = processingRequestId === `${req.project_id}-${req.user_id}`;
              const skills = Array.isArray(req.skills) ? req.skills : [];
              return (
                <div
                  key={`${req.project_id}-${req.user_id}`}
                  style={{
                    background: '#fff', borderRadius: 14,
                    boxShadow: '0 2px 12px rgba(41,82,163,0.07)',
                    border: '1px solid #D9E1F2', padding: '18px 22px',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div className="d-flex gap-3 align-items-start">
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: '#2952A3', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                      }}>
                        {(req.first_name || req.user_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1E2B4A', fontSize: '0.95rem' }}>
                          {req.first_name ? `${req.first_name} ${req.last_name || ''}`.trim() : req.user_name}
                          <span style={{ color: '#A6B3CF', fontWeight: 400, fontSize: '0.82rem', marginLeft: 6 }}>@{req.user_name}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#5E6E9A', marginTop: 2 }}>
                          wants to join <strong>{req.project_title}</strong>
                        </div>
                        {req.experience_level && (
                          <span style={{ display: 'inline-block', marginTop: 6, fontSize: '0.72rem', background: '#EEF2FB', color: '#2952A3', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>
                            {req.experience_level}
                          </span>
                        )}
                        {skills.length > 0 && (
                          <div className="d-flex flex-wrap gap-1 mt-2">
                            {skills.slice(0, 6).map(s => (
                              <span key={s} style={{ background: '#EEF0FD', color: '#4338CA', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 500 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex gap-2 flex-shrink-0">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleAcceptRequest(req.project_id, req.user_id)}
                        className="btn btn-sm"
                        style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, padding: '6px 16px' }}
                      >
                        {isProcessing ? '...' : 'Accept'}
                      </button>
                      <button
                        disabled={isProcessing}
                        onClick={() => handleRejectRequest(req.project_id, req.user_id)}
                        className="btn btn-sm"
                        style={{ background: '#fff', color: '#e53e3e', border: '1.5px solid #fed7d7', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, padding: '6px 16px' }}
                      >
                        {isProcessing ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editingProject && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingProject(null); }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 style={{ fontWeight: 700, color: '#1E2B4A', margin: 0 }}>Edit Project</h5>
              <button
                onClick={() => setEditingProject(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#8A9BBC', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {[
              { label: 'Title', name: 'title', type: 'text' },
              { label: 'GitHub Repository (optional)', name: 'github_repo', type: 'text' },
            ].map(({ label, name, type }) => (
              <div className="mb-3" key={name}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 4, display: 'block' }}>{label}</label>
                <input
                  type={type} name={name} value={editForm[name] || ''}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0DAEE', borderRadius: 8, fontSize: '0.88rem', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#2952A3')}
                  onBlur={e => (e.target.style.borderColor = '#D0DAEE')}
                />
              </div>
            ))}

            <div className="mb-3">
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 4, display: 'block' }}>Description</label>
              <textarea
                name="description" rows={3} value={editForm.description || ''}
                onChange={handleEditChange}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0DAEE', borderRadius: 8, fontSize: '0.88rem', outline: 'none', resize: 'vertical' }}
                onFocus={e => (e.target.style.borderColor = '#2952A3')}
                onBlur={e => (e.target.style.borderColor = '#D0DAEE')}
              />
            </div>

            <div className="mb-3">
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 4, display: 'block' }}>Tech Stack <span style={{ fontWeight: 400, color: '#8A9BBC' }}>(comma-separated)</span></label>
              <input
                type="text" name="tech_stack" value={editForm.tech_stack || ''}
                onChange={handleEditChange}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0DAEE', borderRadius: 8, fontSize: '0.88rem', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#2952A3')}
                onBlur={e => (e.target.style.borderColor = '#D0DAEE')}
              />
            </div>

            <div className="mb-3">
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 6, display: 'block' }}>
                Problem Statements
              </label>
              <p style={{ fontSize: '0.72rem', color: '#A6B3CF', margin: '0 0 8px' }}>
                Remove one once a member has solved it — it'll no longer show as open work.
              </p>

              {(editForm.problem_statements || []).length > 0 && (
                <div className="d-flex flex-column gap-2 mb-2">
                  {editForm.problem_statements.map((ps, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                      background: '#F7F9FD', border: '1px solid #E5EAF6', borderRadius: 8, padding: '8px 12px',
                    }}>
                      <span style={{ fontSize: '0.82rem', color: '#1E2B4A', lineHeight: 1.5 }}>{ps}</span>
                      <button
                        type="button"
                        onClick={() => removeProblemStatement(i)}
                        title="Remove — mark as solved / no longer needed"
                        style={{
                          background: 'none', border: 'none', color: '#DC2626',
                          cursor: 'pointer', fontSize: '1rem', lineHeight: 1, flexShrink: 0, padding: '0 2px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex gap-2">
                <input
                  type="text"
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addProblemStatement(); } }}
                  placeholder="Add a new problem statement..."
                  style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #D0DAEE', borderRadius: 8, fontSize: '0.85rem', outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#2952A3')}
                  onBlur={e => (e.target.style.borderColor = '#D0DAEE')}
                />
                <button
                  type="button"
                  onClick={addProblemStatement}
                  style={{ padding: '9px 16px', background: '#EEF2FB', color: '#2952A3', border: '1px solid #C7D3EE', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="mb-3">
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 4, display: 'block' }}>Urgency</label>
              <select
                name="urgency" value={editForm.urgency || ''}
                onChange={handleEditChange}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0DAEE', borderRadius: 8, fontSize: '0.88rem', outline: 'none' }}
              >
                <option value="">-- Select --</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="d-flex gap-4 mb-4">
              {[{ name: 'is_paid', label: 'Paid Project' }, { name: 'is_private', label: 'Private Project' }].map(({ name, label }) => (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" name={name} checked={!!editForm[name]} onChange={handleEditChange} />
                  {label}
                </label>
              ))}
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                onClick={() => setEditingProject(null)}
                style={{ padding: '9px 20px', border: '1.5px solid #D0DAEE', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                style={{ padding: '9px 24px', background: '#2952A3', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {invitingProject && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setInvitingProject(null); }}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ fontWeight: 700, color: '#1E2B4A', margin: 0 }}>
                <FaUserPlus style={{ marginRight: 8, color: '#2952A3' }} />
                Invite to "{invitingProject.title}"
              </h5>
              <button
                onClick={() => setInvitingProject(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: '#A6B3CF', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {invitingProject.is_private && (
              <div style={{ background: '#EEF2FB', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#2952A3' }}>
                🔒 This project is private — invited users are the only way for anyone to join it.
              </div>
            )}

            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4A5B7A', marginBottom: 5, display: 'block' }}>
              Username
            </label>
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
              placeholder="e.g. aiman_dev"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D9E1F2', borderRadius: 8, fontSize: '0.9rem', outline: 'none', marginBottom: 18 }}
              onFocus={(e) => (e.target.style.borderColor = '#2952A3')}
              onBlur={(e) => (e.target.style.borderColor = '#D9E1F2')}
            />

            <div className="d-flex gap-2 justify-content-end">
              <button
                onClick={() => setInvitingProject(null)}
                style={{ padding: '9px 20px', border: '1.5px solid #D9E1F2', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                Cancel
              </button>
              <button
                onClick={sendInvite}
                disabled={inviteSending}
                style={{ padding: '9px 24px', background: '#2952A3', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: inviteSending ? 'not-allowed' : 'pointer', fontSize: '0.88rem' }}
              >
                {inviteSending ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
