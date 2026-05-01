const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireProjectAccess = async (req, res, next) => {
  const pool = require('../config/db');
  const projectId = req.params.projectId || req.body.project_id;
  
  if (!projectId) return next();

  const [rows] = await pool.query(
    `SELECT pm.* FROM project_members pm WHERE pm.project_id = ? AND pm.user_id = ?
     UNION
     SELECT p.id, p.owner_id, p.owner_id FROM projects p WHERE p.id = ? AND p.owner_id = ?`,
    [projectId, req.user.id, projectId, req.user.id]
  );

  if (!rows.length && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No access to this project' });
  }
  next();
};

module.exports = { requireAdmin, requireProjectAccess };