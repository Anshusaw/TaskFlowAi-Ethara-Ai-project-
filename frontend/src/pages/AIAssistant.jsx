import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Brain, Wand2, Zap, AlertTriangle, Plus, Loader2, CheckCircle2 } from 'lucide-react';

export default function AIAssistant() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [goal, setGoal] = useState('');
  const [decomposed, setDecomposed] = useState(null);
  const [standup, setStandup] = useState('');
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState({});

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data)); }, []);

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  const decompose = async () => {
    if (!goal || !selectedProject) return toast.error('Select a project and enter a goal');
    setLoad('decompose', true);
    try {
      const proj = projects.find(p => p.id == selectedProject);
      const { data } = await api.post('/ai/decompose', { goal, project_name: proj?.name });
      setDecomposed(data);
    } catch { toast.error('Decomposition failed'); }
    finally { setLoad('decompose', false); }
  };

  const createAllTasks = async () => {
    if (!decomposed?.tasks || !selectedProject) return;
    setLoad('createTasks', true);
    let created = 0;
    for (const task of decomposed.tasks) {
      try {
        await api.post('/tasks', {
          title: task.title, description: task.description,
          project_id: selectedProject, priority: task.priority,
          ai_suggested_priority: task.priority
        });
        created++;
      } catch {}
    }
    toast.success(`Created ${created} tasks!`);
    setDecomposed(null);
    setGoal('');
    setLoad('createTasks', false);
  };

  const generateStandup = async () => {
    if (!selectedProject) return toast.error('Select a project');
    setLoad('standup', true);
    try {
      const { data } = await api.post('/ai/standup', { project_id: selectedProject });
      setStandup(data.standup);
    } catch { toast.error('Failed'); }
    finally { setLoad('standup', false); }
  };

  const analyzeRisks = async () => {
    if (!selectedProject) return toast.error('Select a project');
    setLoad('risk', true);
    try {
      const { data } = await api.post('/ai/analyze-risks', { project_id: selectedProject });
      setRiskData(data);
    } catch { toast.error('Failed'); }
    finally { setLoad('risk', false); }
  };

  const riskColors = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)', critical: '#ff0055' };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, background: 'var(--accent-dim)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={22} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>AI Assistant</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Powered by Groq LLaMA 3 · Built for speed</p>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Working on</label>
        <select className="form-control" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          <option value="">— Select a project —</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* 1. Task Decomposer */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Wand2 size={16} color="var(--accent)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Task Decomposer</h3>
          <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 10 }}>HOT</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Describe a feature or goal — AI breaks it into ready-to-assign tasks with priorities.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="form-control" placeholder='e.g. "Build user authentication with OAuth"'
            value={goal} onChange={e => setGoal(e.target.value)} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={decompose} disabled={loading.decompose}>
            {loading.decompose ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
            Decompose
          </button>
        </div>

        {decomposed && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                ✨ {decomposed.tasks?.length} tasks generated
              </span>
              <button className="btn btn-primary" onClick={createAllTasks} disabled={loading.createTasks} style={{ fontSize: 12, padding: '6px 14px' }}>
                {loading.createTasks ? 'Creating...' : <><Plus size={12} /> Create All Tasks</>}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {decomposed.tasks?.map((task, i) => (
                <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.estimated_days && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>~{task.estimated_days}d</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Standup Generator */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Zap size={16} color="var(--yellow)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Standup Generator</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Generate a professional daily standup from your project's current task state.
        </p>
        <button className="btn btn-ghost" onClick={generateStandup} disabled={loading.standup}>
          {loading.standup ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
          Generate Standup
        </button>
        {standup && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {standup}
          </div>
        )}
      </div>

      {/* 3. Risk Analyzer */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={16} color="var(--red)" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>AI Risk Analyzer</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Detect overdue patterns, workload imbalance, and project health risks instantly.
        </p>
        <button className="btn btn-ghost" onClick={analyzeRisks} disabled={loading.risk}>
          {loading.risk ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={14} />}
          Analyze Risks
        </button>
        {riskData && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: riskColors[riskData.risk_level] + '20', color: riskColors[riskData.risk_level], fontWeight: 700, fontSize: 13, marginBottom: 16 }}>
              Risk Level: {riskData.risk_level?.toUpperCase()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>⚠️ Risks</div>
                {riskData.risks?.map((r, i) => <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-muted)' }}>• {r}</div>)}
              </div>
              <div style={{ padding: 14, background: 'rgba(16,185,129,0.06)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>✅ Recommendations</div>
                {riskData.recommendations?.map((r, i) => <div key={i} style={{ fontSize: 12, padding: '4px 0', color: 'var(--text-muted)' }}>• {r}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}