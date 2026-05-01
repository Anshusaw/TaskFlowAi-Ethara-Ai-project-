const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askGroq(systemPrompt, userMessage, jsonMode = false) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',   // updated model name
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.7,
    max_tokens: 1024,
    ...(jsonMode && { response_format: { type: 'json_object' } })
  });
  return response.choices[0].message.content;
}

// 1. AI Task Decomposer
router.post('/decompose', auth, async (req, res) => {
  try {
    const { goal, project_name } = req.body;
    if (!goal) return res.status(400).json({ error: 'Goal is required' });

    const result = await askGroq(
      `You are a senior project manager AI. Break down user goals into actionable tasks.
       Always return valid JSON only. No markdown, no explanation, no code blocks.`,
      `Project: "${project_name}". Goal: "${goal}".
       Return JSON: { "tasks": [{ "title": string, "description": string, "priority": "low|medium|high|critical", "estimated_days": number }] }
       Generate 3-6 specific, actionable tasks.`,
      true
    );
    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (err) {
    console.error('AI decompose error:', err.message);
    res.status(500).json({ error: 'AI decomposition failed', details: err.message });
  }
});

// 2. AI Priority Suggester
router.post('/suggest-priority', auth, async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    const daysUntilDue = due_date
      ? Math.floor((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    const result = await askGroq(
      `You are a task prioritization AI. Analyze task details and return JSON only. No markdown, no code blocks.`,
      `Task: "${title}". Description: "${description || 'none'}". Days until due: ${daysUntilDue ?? 'no deadline'}.
       Return JSON: { "priority": "low|medium|high|critical", "reason": string (max 20 words) }`,
      true
    );
    res.json(JSON.parse(result));
  } catch (err) {
    console.error('AI priority error:', err.message);
    res.status(500).json({ error: 'Priority suggestion failed', details: err.message });
  }
});

// 3. AI Standup Generator
router.post('/standup', auth, async (req, res) => {
  try {
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    const [tasks] = await pool.query(
      `SELECT t.title, t.status, t.priority, t.due_date, u.name as assignee
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ? ORDER BY t.updated_at DESC LIMIT 20`,
      [project_id]
    );

    const [project] = await pool.query('SELECT name FROM projects WHERE id = ?', [project_id]);
    if (!project.length) return res.status(404).json({ error: 'Project not found' });

    const taskSummary = tasks.map(t =>
      `- "${t.title}" | ${t.status} | ${t.priority} priority | assigned to ${t.assignee || 'unassigned'} | due ${t.due_date || 'no date'}`
    ).join('\n');

    const result = await askGroq(
      `You are a technical project manager writing concise daily standups. Be specific, professional, and brief.`,
      `Project: ${project[0].name}. Current tasks:\n${taskSummary}\n\nWrite a daily standup summary with: Done, In Progress, Blockers/Risks. Max 150 words.`
    );

    res.json({ standup: result });
  } catch (err) {
    console.error('AI standup error:', err.message);
    res.status(500).json({ error: 'Standup generation failed', details: err.message });
  }
});

// 4. AI Risk Analyzer
router.post('/analyze-risks', auth, async (req, res) => {
  try {
    const { project_id } = req.body;
    if (!project_id) return res.status(400).json({ error: 'project_id is required' });

    const [tasks] = await pool.query(
      `SELECT t.title, t.status, t.priority, t.due_date, u.name as assignee,
        CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END as is_overdue
       FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?`,
      [project_id]
    );

    const result = await askGroq(
      `You are a risk analysis AI. Analyze project health and return JSON only. No markdown, no code blocks.`,
      `Tasks data: ${JSON.stringify(tasks)}.
       Return JSON: { "risk_level": "low|medium|high|critical", "risks": [string], "recommendations": [string] }
       Max 3 risks, 3 recommendations.`,
      true
    );

    res.json(JSON.parse(result));
  } catch (err) {
    console.error('AI risk error:', err.message);
    res.status(500).json({ error: 'Risk analysis failed', details: err.message });
  }
});

module.exports = router;
