const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users (for member assignment dropdowns)
router.get('/', auth, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, avatar_color FROM users ORDER BY name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [taskStats] = await pool.query(
      isAdmin
        ? `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`
        : `SELECT status, COUNT(*) as count FROM tasks WHERE assigned_to = ? OR created_by = ? GROUP BY status`,
      isAdmin ? [] : [userId, userId]
    );

    const [overdueCount] = await pool.query(
      isAdmin
        ? `SELECT COUNT(*) as count FROM tasks WHERE due_date < CURDATE() AND status != 'done'`
        : `SELECT COUNT(*) as count FROM tasks WHERE due_date < CURDATE() AND status != 'done' AND (assigned_to = ? OR created_by = ?)`,
      isAdmin ? [] : [userId, userId]
    );

    const [projectCount] = await pool.query(
      isAdmin
        ? `SELECT COUNT(*) as count FROM projects`
        : `SELECT COUNT(DISTINCT p.id) as count FROM projects p LEFT JOIN project_members pm ON pm.project_id = p.id WHERE p.owner_id = ? OR pm.user_id = ?`,
      isAdmin ? [] : [userId, userId]
    );

    const [recentTasks] = await pool.query(
      `SELECT t.*, u.name as assignee_name, p.name as project_name
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id LEFT JOIN projects p ON t.project_id = p.id
       ${isAdmin ? '' : 'WHERE t.assigned_to = ? OR t.created_by = ?'}
       ORDER BY t.updated_at DESC LIMIT 5`,
      isAdmin ? [] : [userId, userId]
    );

    res.json({
      taskStats: taskStats.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {}),
      overdue: overdueCount[0].count,
      projects: projectCount[0].count,
      recentTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;