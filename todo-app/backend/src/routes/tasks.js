const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tasks
router.get('/', (req, res) => {
  const { filter, priority } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.userId];

  if (filter === 'completed') { query += ' AND completed = 1'; }
  else if (filter === 'active') { query += ' AND completed = 0'; }

  if (priority) { query += ' AND priority = ?'; params.push(priority); }

  query += ' ORDER BY created_at DESC';
  const tasks = db.prepare(query).all(...params);
  res.json(tasks.map(t => ({ ...t, completed: !!t.completed })));
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, priority = 'medium', due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const result = db.prepare(
    'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)'
  ).run(req.userId, title, description || null, priority, due_date || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...task, completed: !!task.completed });
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, completed, priority, due_date } = req.body;
  const updated = db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      completed = COALESCE(?, completed),
      priority = COALESCE(?, priority),
      due_date = COALESCE(?, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? null, description ?? null,
    completed !== undefined ? (completed ? 1 : 0) : null,
    priority ?? null, due_date ?? null,
    req.params.id, req.userId
  );
  const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ ...result, completed: !!result.completed });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/stats
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(req.userId).count;
  const completed = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1').get(req.userId).count;
  res.json({ total, completed, active: total - completed });
});

module.exports = router;
