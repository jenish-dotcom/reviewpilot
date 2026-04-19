const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE user_id = $1', [req.userId]);
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO settings (user_id) VALUES ($1)', [req.userId]);
      return res.json({ tone: 'professional', emailSummaryEnabled: true, emailSummaryTime: '08:00', businessName: null, businessType: null });
    }
    const s = result.rows[0];
    res.json({
      tone: s.tone,
      emailSummaryEnabled: s.email_summary_enabled,
      emailSummaryTime: s.email_summary_time,
      businessName: s.business_name,
      businessType: s.business_type,
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', auth, async (req, res) => {
  const { tone, emailSummaryEnabled, emailSummaryTime, businessName, businessType } = req.body;

  const validTones = ['professional', 'friendly', 'apologetic'];
  if (tone && !validTones.includes(tone)) {
    return res.status(400).json({ error: 'Invalid tone. Must be professional, friendly, or apologetic' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO settings (user_id, tone, email_summary_enabled, email_summary_time, business_name, business_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE SET
         tone = COALESCE($2, settings.tone),
         email_summary_enabled = COALESCE($3, settings.email_summary_enabled),
         email_summary_time = COALESCE($4, settings.email_summary_time),
         business_name = COALESCE($5, settings.business_name),
         business_type = COALESCE($6, settings.business_type)
       RETURNING *`,
      [req.userId, tone, emailSummaryEnabled, emailSummaryTime, businessName, businessType]
    );
    const s = result.rows[0];
    res.json({
      tone: s.tone,
      emailSummaryEnabled: s.email_summary_enabled,
      emailSummaryTime: s.email_summary_time,
      businessName: s.business_name,
      businessType: s.business_type,
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
