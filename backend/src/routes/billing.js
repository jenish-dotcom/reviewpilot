const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

router.post('/checkout', auth, async (req, res) => {
  const { tier } = req.body;

  if (!PRICE_IDS[tier]) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.userId]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: { userId: req.userId, tier },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/portal', auth, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.get('/subscription', auth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT subscription_tier, subscription_status, stripe_subscription_id, reviews_this_month FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];
    res.json({
      tier: user.subscription_tier,
      status: user.subscription_status,
      reviewsThisMonth: user.reviews_this_month,
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, tier } = session.metadata;
        await pool.query(
          'UPDATE users SET subscription_tier = $1, subscription_status = $2, stripe_subscription_id = $3 WHERE id = $4',
          [tier, 'active', session.subscription, userId]
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await pool.query(
          'UPDATE users SET subscription_tier = $1, subscription_status = $2, stripe_subscription_id = NULL WHERE stripe_subscription_id = $3',
          ['free', 'inactive', sub.id]
        );
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const status = sub.status === 'active' ? 'active' : 'inactive';
        await pool.query(
          'UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2',
          [status, sub.id]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
