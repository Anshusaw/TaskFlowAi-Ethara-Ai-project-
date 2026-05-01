import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, X, Wand2, AlertTriangle, FileText, Loader2 } from 'lucide-react';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function CreateTaskModal({ projectId, members, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'todo' });
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedPriority, setSuggestedPriority] = useState(null);
  const [loading, setLoading] = useState(false);

  const suggestPriority = async () => {
    if (!form.title) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/suggest-priority', { title: form.title, description: form.description, due_date: form.due_date });
      setSuggestedPriority(data);
      setForm(f => ({ ...f, priority: data.priority, ai_suggested_priority: data.priority }));
      toast.success('AI priority suggestion applied!');
    } catch { toast.error('AI suggestion failed'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tasks', { ...form, project_id: projectId, assigned_to: form.assigned_to || null });
      toast.success('Task created!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Task Title *</label>
            <input className="form-control" placeholder="e.g. Set up CI/CD pipeline"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Assign To</label>
              <select className="form-control" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Priority</label>
                <button type="button" onClick={suggestPriority} disabled={aiLoading || !form.title}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {aiLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={12} />}
                  AI suggest
                </button>
              </div>
              <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {suggestedPriority && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>💡 {suggestedPriority.reason}</div>
              )}
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input className="form-control" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [standup, setStandup] = useState('');
  const [standupLoading, setStandupLoading] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const load = async () => {
    const [p, t] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project_id=${id}`)]);
    setProject(p.data);
    setTasks(t.data);
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const generateStandup = async () => {
    setStandupLoading(true);
    try {
      const { data } = await api.post('/ai/standup', { project_id: id });
      setStandup(data.standup);
    } catch { toast.error('Failed to generate standup'); }
    finally { setStandupLoading(false); }
  };

  const analyzeRisks = async () => {
    setRiskLoading(true);
    try {
      const { data } = await api.post('/ai/analyze-risks', { project_id: id });
      setRiskData(data);
    } catch { toast.error('Risk analysis failed'); }
    finally { setRiskLoading(false); }
  };

  const riskColors = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)', critical: '#ff0055' };

  if (!project) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{project.name}</h1>
        {project.description && <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{project.description}</p>}
        
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Add Task
            </button>
          )}
          <button className="btn btn-ghost" onClick={generateStandup} disabled={standupLoading}>
            {standupLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
            AI Standup
          </button>
          <button className="btn btn-ghost" onClick={analyzeRisks} disabled={riskLoading}>
            {riskLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={14} />}
            AI Risk Analysis
          </button>
        </div>
      </div>

      {/* AI Standup Output */}
      {standup && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>🤖 AI Daily Standup</span>
            <button onClick={() => setStandup('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{standup}</p>
        </div>
      )}

      {/* Risk Analysis Output */}
      {riskData && (
        <div className="card" style={{ marginBottom: 20, borderColor: riskColors[riskData.risk_level] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: riskColors[riskData.risk_level] }}>
              ⚠️ Risk Level: {riskData.risk_level?.toUpperCase()}
            </span>
            <button onClick={() => setRiskData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Risks</div>
              {riskData.risks?.map((r, i) => <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--red)' }}>• {r}</div>)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Recommendations</div>
              {riskData.recommendations?.map((r, i) => <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--green)' }}>• {r}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {STATUSES.map(status => {
          const colTasks = tasks.filter(t => t.status === status);
          return (
            <div key={status}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>
                  {STATUS_LABELS[status]}
                </span>
                <span style={{ fontSize: 11, background: 'var(--bg-3)', padding: '2px 8px', borderRadius: 10, color: 'var(--text-muted)' }}>
                  {colTasks.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
                {colTasks.map(task => (
                  <div key={task.id} className="card" style={{ padding: 12, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.ai_suggested_priority && <span style={{ fontSize: 9, color: 'var(--accent)' }}>AI ✦</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, lineHeight: 1.4 }}>{task.title}</p>
                    {task.assignee_name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: task.assignee_color || '#6366f1' }}>
                          {task.assignee_name[0]}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.assignee_name}</span>
                      </div>
                    )}
                    {task.due_date && (
                      <div style={{ marginTop: 8, fontSize: 10, color: new Date(task.due_date) < new Date() ? 'var(--red)' : 'var(--text-dim)' }}>
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {isAdmin && (
                      <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                        style={{ marginTop: 8, fontSize: 11, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 6, padding: '4px 6px', width: '100%', cursor: 'pointer' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && project?.members && (
        <CreateTaskModal projectId={id} members={project.members} onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}