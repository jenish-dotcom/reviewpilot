require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const billingRoutes = require('./routes/billing');
const { startEmailSummaryJob } = require('./jobs/emailSummary');

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook needs raw body — mount before json parser
app.use('/api/billing/webhook', billingRoutes);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ReviewPilot API running on port ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    startEmailSummaryJob();
  }
});

module.exports = app;
