const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, subscription_tier',
      [email.toLowerCase(), passwordHash, name || null]
    );
    const user = result.rows[0];

    // Create default settings
    await pool.query('INSERT INTO settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);

    const token = jwt.sign(
      { userId: user.id, tier: user.subscription_tier },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.subscription_tier } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, tier: user.subscription_tier },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.subscription_tier } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, subscription_tier, reviews_this_month, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, name: user.name, tier: user.subscription_tier, reviewsThisMonth: user.reviews_this_month, createdAt: user.created_at });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
