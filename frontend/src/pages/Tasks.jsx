import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Filter, CheckSquare } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    const params = isAdmin ? {} : { assigned_to: user?.id };
    api.get('/tasks', { params }).then(r => setTasks(r.data));
  }, []);

  const updateStatus = async (taskId, status) => {
    await api.patch(`/tasks/${taskId}/status`, { status });
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t));
    toast.success('Status updated');
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>My Tasks</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          {tasks.length} total • {overdue > 0 && <span style={{ color: 'var(--red)' }}>{overdue} overdue</span>}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'todo', 'in_progress', 'review', 'done'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn"
            style={{
              padding: '6px 14px', fontSize: 12,
              background: filter === f ? 'var(--accent)' : 'var(--bg-3)',
              color: filter === f ? 'white' : 'var(--text-muted)',
              border: '1px solid', borderColor: filter === f ? 'var(--accent)' : 'var(--border)'
            }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(task => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
          return (
            <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderColor: isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span>
                  {task.ai_suggested_priority && <span style={{ fontSize: 10, color: 'var(--accent)' }}>✦ AI</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {task.project_name}
                  {task.due_date && <span style={{ marginLeft: 12, color: isOverdue ? 'var(--red)' : 'var(--text-dim)' }}>
                    {isOverdue ? '⚠️ Overdue: ' : '📅 '}{new Date(task.due_date).toLocaleDateString()}
                  </span>}
                </div>
              </div>
              <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
              <select value={task.status} onChange={e => updateStatus(task.id, e.target.value)}
                style={{ fontSize: 12, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                {['todo', 'in_progress', 'review', 'done'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          );
        })}
        {!filtered.length && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <CheckSquare size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No tasks found.</p>
          </div>
        )}
      </div>
    </div>
  );
}