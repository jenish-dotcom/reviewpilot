const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { generateReviewResponse } = require('../services/claude');

const router = express.Router();

const TIER_LIMITS = { free: 5, basic: 50, pro: Infinity, enterprise: Infinity };

router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 20, rating, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = 'SELECT * FROM reviews WHERE user_id = $1';
    const params = [req.userId];

    if (rating) {
      params.push(parseInt(rating));
      query += ` AND rating = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (reviewer_name ILIKE $${params.length} OR review_text ILIKE $${params.length})`;
    }

    const countResult = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(parseInt(offset));
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ reviews: result.rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', auth, async (req, res) => {
  const { reviewerName, rating, reviewText, source = 'google' } = req.body;

  if (!reviewText || !rating) {
    return res.status(400).json({ error: 'Review text and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const userResult = await pool.query(
      'SELECT subscription_tier, reviews_this_month FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];
    const limit = TIER_LIMITS[user.subscription_tier] || TIER_LIMITS.free;

    if (user.reviews_this_month >= limit) {
      return res.status(402).json({
        error: 'Monthly review limit reached',
        tier: user.subscription_tier,
        limit,
      });
    }

    const settingsResult = await pool.query(
      'SELECT tone, business_name FROM settings WHERE user_id = $1',
      [req.userId]
    );
    const settings = settingsResult.rows[0] || {};

    const aiResponse = await generateReviewResponse({
      reviewerName,
      rating: parseInt(rating),
      reviewText,
      tone: settings.tone || 'professional',
      businessName: settings.business_name || 'our business',
    });

    const result = await pool.query(
      `INSERT INTO reviews (user_id, reviewer_name, rating, review_text, ai_response, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, reviewerName || 'Anonymous', parseInt(rating), reviewText, aiResponse, source]
    );

    await pool.query(
      'UPDATE users SET reviews_this_month = reviews_this_month + 1 WHERE id = $1',
      [req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { editedResponse, responded } = req.body;

  try {
    const check = await pool.query('SELECT id FROM reviews WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const updates = [];
    const params = [];

    if (editedResponse !== undefined) {
      params.push(editedResponse);
      updates.push(`edited_response = $${params.length}`);
    }
    if (responded) {
      updates.push('responded_at = NOW()');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE reviews SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

router.post('/:id/regenerate', auth, async (req, res) => {
  try {
    const reviewResult = await pool.query(
      'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    const review = reviewResult.rows[0];

    const settingsResult = await pool.query('SELECT tone, business_name FROM settings WHERE user_id = $1', [req.userId]);
    const settings = settingsResult.rows[0] || {};

    const aiResponse = await generateReviewResponse({
      reviewerName: review.reviewer_name,
      rating: review.rating,
      reviewText: review.review_text,
      tone: settings.tone || 'professional',
      businessName: settings.business_name || 'our business',
    });

    const result = await pool.query(
      'UPDATE reviews SET ai_response = $1, edited_response = NULL WHERE id = $2 RETURNING *',
      [aiResponse, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Regenerate error:', err);
    res.status(500).json({ error: 'Failed to regenerate response' });
  }
});

module.exports = router;
