const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get tasks (by project or assigned to me)
router.get('/', auth, async (req, res) => {
  try {
    const { project_id, assigned_to, status } = req.query;
    let query = `
      SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
        p.name as project_name, c.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE 1=1`;
    const params = [];

    if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
    if (assigned_to) { query += ' AND t.assigned_to = ?'; params.push(assigned_to); }
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    
    if (req.user.role !== 'admin') {
      query += ' AND (t.assigned_to = ? OR t.created_by = ?)';
      params.push(req.user.id, req.user.id);
    }

    query += ' ORDER BY t.created_at DESC';

    const [tasks] = await pool.query(query, params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, status, priority, due_date, ai_suggested_priority } = req.body;
    if (!title || !project_id) return res.status(400).json({ error: 'Title and project are required' });

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, project_id, assigned_to || null, req.user.id,
       status || 'todo', priority || 'medium', due_date || null, ai_suggested_priority || null]
    );

    res.status(201).json({ id: result.insertId, title, project_id, status: status || 'todo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, assigned_to, status, priority, due_date } = req.body;
    await pool.query(
      'UPDATE tasks SET title=?, description=?, assigned_to=?, status=?, priority=?, due_date=? WHERE id=?',
      [title, description, assigned_to, status, priority, due_date, req.params.id]
    );
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update only status (quick update)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE tasks SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a task
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const [comments] = await pool.query(
      `SELECT c.*, u.name as user_name, u.avatar_color FROM comments c
       JOIN users u ON c.user_id = u.id WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const [result] = await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content]
    );
    res.status(201).json({ id: result.insertId, content, user_name: req.user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;