import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => { api.get('/users').then(r => setUsers(r.data)); }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Team</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>{users.length} members</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {users.map(u => (
          <div key={u.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, background: u.avatar_color }}>{u.name[0]}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
              <span style={{
                display: 'inline-block', marginTop: 4, fontSize: 10, padding: '2px 8px', borderRadius: 10, textTransform: 'capitalize',
                background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--bg-3)',
                color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)'
              }}>{u.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}