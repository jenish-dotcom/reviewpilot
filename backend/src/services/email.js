const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendDailySummary({ to, userName, businessName, reviews, date }) {
  const formattedDate = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const reviewsHtml = reviews.map(r => `
    <div style="border-left: 3px solid #6366f1; padding-left: 12px; margin-bottom: 16px;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 6px;">
        ${r.reviewer_name || 'Anonymous'} — ${'★'.repeat(r.star_rating || 5)} ${r.platform || 'Google'}
      </p>
      <p style="margin: 0 0 8px; color: #374151;">"${r.original_review.slice(0, 200)}${r.original_review.length > 200 ? '...' : ''}"</p>
      ${r.ai_response ? `<p style="margin: 0; color: #4f46e5; font-size: 13px;">Response generated ✓</p>` : ''}
    </div>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="display: flex; align-items: center; margin-bottom: 24px;">
          <div style="background: #6366f1; color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; margin-right: 12px;">R</div>
          <div>
            <h1 style="margin: 0; font-size: 20px; color: #111827;">ReviewPilot</h1>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">Daily Review Summary</p>
          </div>
        </div>

        <h2 style="font-size: 18px; color: #111827; margin: 0 0 8px;">Good morning${userName ? ', ' + userName.split(' ')[0] : ''}!</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">${formattedDate}</p>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; gap: 16px;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: bold; color: #6366f1;">${reviews.length}</div>
            <div style="font-size: 12px; color: #6b7280;">Reviews Today</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: bold; color: #10b981;">${reviews.filter(r => r.ai_response).length}</div>
            <div style="font-size: 12px; color: #6b7280;">Responses Generated</div>
          </div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 28px; font-weight: bold; color: #f59e0b;">${reviews.filter(r => r.star_rating >= 4).length}</div>
            <div style="font-size: 12px; color: #6b7280;">Positive Reviews</div>
          </div>
        </div>

        ${reviews.length > 0 ? `
          <h3 style="font-size: 15px; color: #374151; margin: 0 0 16px;">Today's Reviews</h3>
          ${reviewsHtml}
        ` : '<p style="color: #6b7280; text-align: center; padding: 24px 0;">No new reviews today. Keep up the great work!</p>'}

        <div style="text-align: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #6366f1; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">View Dashboard →</a>
        </div>
      </div>

      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
        ReviewPilot · <a href="${process.env.FRONTEND_URL}/settings" style="color: #9ca3af;">Manage email preferences</a>
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your daily review summary — ${reviews.length} review${reviews.length !== 1 ? 's' : ''} today`,
    html,
  });
}

module.exports = { sendDailySummary };
