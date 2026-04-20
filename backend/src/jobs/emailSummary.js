const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../db/pool');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendDailySummary() {
  try {
    const usersResult = await pool.query(
      `SELECT u.id, u.email, u.name, s.business_name
       FROM users u
       JOIN settings s ON s.user_id = u.id
       WHERE s.email_summary_enabled = 1`
    );

    for (const user of usersResult.rows) {
      const reviewsResult = await pool.query(
        `SELECT reviewer_name, rating, review_text, ai_response, created_at
         FROM reviews
         WHERE user_id = $1 AND created_at > datetime('now', '-24 hours')
         ORDER BY created_at DESC`,
        [user.id]
      );

      if (reviewsResult.rows.length === 0) continue;

      const reviews = reviewsResult.rows;
      const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

      const reviewHtml = reviews.map(r => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <strong>${r.reviewer_name}</strong>
            <span style="color:#f59e0b;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          </div>
          <p style="color:#374151;margin:0 0 12px;">"${r.review_text}"</p>
          <div style="background:#f9fafb;border-radius:6px;padding:12px;">
            <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">Suggested Response:</p>
            <p style="color:#374151;margin:0;">${r.ai_response}</p>
          </div>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#4f46e5;color:white;padding:20px;border-radius:8px;margin-bottom:24px;">
            <h1 style="margin:0;font-size:24px;">ReviewPilot Daily Summary</h1>
            <p style="margin:4px 0 0;opacity:0.8;">${user.business_name || 'Your Business'}</p>
          </div>
          <div style="display:flex;gap:16px;margin-bottom:24px;">
            <div style="flex:1;background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:bold;color:#1d4ed8;margin:0;">${reviews.length}</p>
              <p style="color:#6b7280;margin:4px 0 0;">New Reviews</p>
            </div>
            <div style="flex:1;background:#fef9c3;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:bold;color:#92400e;margin:0;">${avgRating} ★</p>
              <p style="color:#6b7280;margin:4px 0 0;">Avg Rating</p>
            </div>
          </div>
          <h2 style="color:#111827;margin-bottom:16px;">Today's Reviews</h2>
          ${reviewHtml}
          <div style="text-align:center;margin-top:24px;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              View &amp; Respond on ReviewPilot →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px;">
            You're receiving this because you have daily email summaries enabled.
            <a href="${process.env.FRONTEND_URL}/settings">Manage settings</a>
          </p>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: `📊 ${reviews.length} new review${reviews.length > 1 ? 's' : ''} — ReviewPilot Daily Summary`,
        html,
      });

      console.log(`Daily summary sent to ${user.email}`);
    }
  } catch (err) {
    console.error('Email summary job failed:', err);
  }
}

function startEmailSummaryJob() {
  cron.schedule('0 * * * *', sendDailySummary);
  console.log('Email summary job scheduled');
}

module.exports = { startEmailSummaryJob, sendDailySummary };
