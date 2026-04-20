const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const [totalResult, avgRatingResult, responseRateResult, ratingDistResult, trendResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM reviews WHERE user_id = $1', [userId]),
      pool.query('SELECT ROUND(AVG(rating), 1) as avg FROM reviews WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT
           SUM(CASE WHEN responded_at IS NOT NULL THEN 1 ELSE 0 END) as responded,
           COUNT(*) as total
         FROM reviews WHERE user_id = $1`,
        [userId]
      ),
      pool.query(
        'SELECT rating, COUNT(*) as count FROM reviews WHERE user_id = $1 GROUP BY rating ORDER BY rating DESC',
        [userId]
      ),
      pool.query(
        `SELECT strftime('%Y-%W', created_at) as week, COUNT(*) as count, ROUND(AVG(rating), 1) as avg_rating
         FROM reviews WHERE user_id = $1 AND created_at > datetime('now', '-84 days')
         GROUP BY week ORDER BY week ASC`,
        [userId]
      ),
    ]);

    const responseRate = responseRateResult.rows[0];
    const totalReviews = parseInt(totalResult.rows[0].count);
    const responded = parseInt(responseRate.responded || 0);
    const total = parseInt(responseRate.total || 0);

    res.json({
      totalReviews,
      avgRating: parseFloat(avgRatingResult.rows[0].avg) || 0,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      ratingDistribution: ratingDistResult.rows.map(r => ({
        rating: parseInt(r.rating),
        count: parseInt(r.count),
      })),
      weeklyTrend: trendResult.rows.map(r => ({
        week: r.week,
        count: parseInt(r.count),
        avgRating: parseFloat(r.avg_rating),
      })),
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
