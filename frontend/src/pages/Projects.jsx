import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckCircle, X, Calendar } from 'lucide-react';

function CreateProjectModal({ onClose, onCreated, users }) {
  const [form, setForm] = useState({ name: '', description: '', deadline: '', member_ids: [] });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(id) ? f.member_ids.filter(x => x !== id) : [...f.member_ids, id]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label>Project Name *</label>
            <input className="form-control" placeholder="e.g. Q2 Marketing Campaign"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={3} placeholder="What is this project about?"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input className="form-control" type="date"
              value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Add Team Members</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 140, overflowY: 'auto' }}>
              {users.map(u => (
                <div key={u.id} onClick={() => toggleMember(u.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 20, cursor: 'pointer', border: '1px solid',
                  borderColor: form.member_ids.includes(u.id) ? 'var(--accent)' : 'var(--border)',
                  background: form.member_ids.includes(u.id) ? 'var(--accent-dim)' : 'var(--bg-3)',
                  fontSize: 12, color: form.member_ids.includes(u.id) ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.15s'
                }}>
                  <div className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: u.avatar_color }}>{u.name[0]}</div>
                  {u.name}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const load = async () => {
    const [p, u] = await Promise.all([api.get('/projects'), api.get('/users')]);
    setProjects(p.data);
    setUsers(u.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const statusColor = { active: 'var(--green)', completed: 'var(--blue)', archived: 'var(--text-muted)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Projects</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{projects.length} projects in your workspace</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Project
          </button>
        )}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(p => {
            const progress = p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', ':hover': {} }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderKanban size={18} color="var(--accent)" />
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: statusColor[p.status] + '20', color: statusColor[p.status] }}>
                      {p.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5, minHeight: 32 }}>
                    {p.description?.slice(0, 80) || 'No description'}
                  </p>
                  <div className="progress-bar" style={{ marginBottom: 8 }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{progress}% complete</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> {p.member_count}</span>
                  </div>
                  {p.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                      <Calendar size={11} />
                      Due {new Date(p.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
          {!projects.length && (
            <div className="card" style={{ textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>
              <FolderKanban size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No projects yet. {isAdmin && 'Create your first one!'}</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={load} users={users} />}
    </div>
  );
}