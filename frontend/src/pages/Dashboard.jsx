import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, FolderKanban, TrendingUp, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/stats/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>;

  const taskData = [
    { name: 'To Do', value: stats?.taskStats?.todo || 0, color: '#4a4a6a' },
    { name: 'In Progress', value: stats?.taskStats?.in_progress || 0, color: '#3b82f6' },
    { name: 'Review', value: stats?.taskStats?.review || 0, color: '#f59e0b' },
    { name: 'Done', value: stats?.taskStats?.done || 0, color: '#10b981' },
  ];

  const totalTasks = taskData.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening across your workspace</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: FolderKanban, label: 'Projects', value: stats?.projects || 0, color: 'var(--accent)' },
          { icon: CheckCircle2, label: 'Total Tasks', value: totalTasks, color: 'var(--green)' },
          { icon: Clock, label: 'In Progress', value: stats?.taskStats?.in_progress || 0, color: 'var(--blue)' },
          { icon: AlertTriangle, label: 'Overdue', value: stats?.overdue || 0, color: 'var(--red)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <TrendingUp size={16} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Task Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {taskData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Zap size={16} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Recent Activity</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats?.recentTasks?.slice(0, 4).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.project_name}</div>
                </div>
              </div>
            ))}
            {!stats?.recentTasks?.length && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No tasks yet.</p>}
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/projects" className="btn btn-ghost">View all projects →</Link>
        <Link to="/tasks" className="btn btn-ghost">View my tasks →</Link>
        <Link to="/ai" className="btn btn-primary">Try AI Assistant ✨</Link>
      </div>
    </div>
  );
}