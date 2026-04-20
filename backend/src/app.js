require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const db = require('./db');
const { sendDailySummary } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3001;

// Raw body for Stripe webhook (must be before json middleware)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many AI requests, please slow down' },
});
app.use('/api/reviews', aiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/billing', require('./routes/billing'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Daily email summary cron — runs every hour, checks user's preferred time
cron.schedule('0 * * * *', async () => {
  const currentHour = new Date().toTimeString().slice(0, 5);
  console.log(`Running email summary cron at ${currentHour}`);

  try {
    const users = await db.query(
      `SELECT u.id, u.email, u.full_name, u.business_name
       FROM users u
       WHERE u.email_summary_enabled = true
         AND u.email_summary_time = $1
         AND u.subscription_plan != 'free'`,
      [currentHour]
    );

    for (const user of users.rows) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const reviews = await db.query(
          `SELECT * FROM reviews WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC`,
          [user.id, today]
        );

        await sendDailySummary({
          to: user.email,
          userName: user.full_name,
          businessName: user.business_name,
          reviews: reviews.rows,
        });

        await db.query(
          `INSERT INTO email_summaries (user_id, reviews_count) VALUES ($1, $2)`,
          [user.id, reviews.rows.length]
        );
      } catch (userErr) {
        console.error(`Failed to send summary for user ${user.id}:`, userErr);
      }
    }
  } catch (err) {
    console.error('Email summary cron error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`ReviewPilot API running on port ${PORT}`);
});

module.exports = app;
