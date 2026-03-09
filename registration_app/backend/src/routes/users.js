const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { validateRegistration } = require('../middleware/validate');

const router = express.Router();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// POST /api/register
router.post('/register', validateRegistration, (req, res) => {
  const { name, phone, email, password } = req.body;

  // Check duplicate email
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ errors: ['An account with this email already exists.'] });
  }

  const hash = bcrypt.hashSync(password, ROUNDS);

  const result = db
    .prepare('INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)')
    .run(name, phone, email, hash);

  return res.status(201).json({
    message: 'Registration successful.',
    userId: result.lastInsertRowid,
  });
});

// GET /api/users  – returns all users (no passwords) for testing
router.get('/users', (req, res) => {
  const users = db
    .prepare('SELECT id, name, phone, email, created_at FROM users ORDER BY id DESC')
    .all();
  res.json(users);
});

module.exports = router;
