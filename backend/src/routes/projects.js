const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/role');

// Get all projects (admin sees all, member sees their own)
router.get('/', auth, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `
        SELECT p.*, u.name as owner_name,
          COUNT(DISTINCT t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
          COUNT(DISTINCT pm.user_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN project_members pm ON pm.project_id = p.id
        GROUP BY p.id ORDER BY p.created_at DESC`;
      params = [];
    } else {
      query = `
        SELECT p.*, u.name as owner_name,
          COUNT(DISTINCT t.id) as total_tasks,
          SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
          COUNT(DISTINCT pm2.user_id) as member_count
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        LEFT JOIN project_members pm2 ON pm2.project_id = p.id
        WHERE p.owner_id = ? OR pm.user_id = ?
        GROUP BY p.id ORDER BY p.created_at DESC`;
      params = [req.user.id, req.user.id, req.user.id];
    }

    const [projects] = await pool.query(query, params);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description, deadline, member_ids } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id, deadline) VALUES (?, ?, ?, ?)',
      [name, description || null, req.user.id, deadline || null]
    );

    const projectId = result.insertId;
    
    // Add owner as member
    await pool.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, req.user.id]);
    
    // Add other members
    if (member_ids && member_ids.length) {
      for (const uid of member_ids) {
        if (uid !== req.user.id) {
          await pool.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, uid]);
        }
      }
    }

    res.status(201).json({ id: projectId, name, description, deadline, owner_id: req.user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project with members
router.get('/:id', auth, async (req, res) => {
  try {
    const [projects] = await pool.query(
      'SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?',
      [req.params.id]
    );
    if (!projects.length) return res.status(404).json({ error: 'Project not found' });

    const [members] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.avatar_color FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ?',
      [req.params.id]
    );

    res.json({ ...projects[0], members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;
    await pool.query(
      'UPDATE projects SET name=?, description=?, status=?, deadline=? WHERE id=?',
      [name, description, status, deadline, req.params.id]
    );
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to project
router.post('/:id/members', auth, requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    await pool.query('INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [req.params.id, user_id]);
    res.json({ message: 'Member added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member
router.delete('/:id/members/:userId', auth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id=? AND user_id=?', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;