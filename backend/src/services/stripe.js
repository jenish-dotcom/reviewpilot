const Stripe = require('stripe');
const db = require('../db');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_ID_STARTER,
    reviewsPerMonth: 100,
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    reviewsPerMonth: -1, // unlimited
  },
};

async function createCheckoutSession({ userId, plan, successUrl, cancelUrl }) {
  const planConfig = PLANS[plan];
  if (!planConfig) throw new Error(`Invalid plan: ${plan}`);

  const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || user.business_name,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, userId]);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  });

  return session;
}

async function createPortalSession({ userId, returnUrl }) {
  const userResult = await db.query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];
  if (!user.stripe_customer_id) throw new Error('No billing account found');

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl,
  });

  return session;
}

async function handleWebhook({ rawBody, signature }) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const plan = sub.metadata?.plan || 'starter';
      await db.query(
        `UPDATE users SET
          stripe_subscription_id = $1,
          subscription_status = $2,
          subscription_plan = $3,
          subscription_current_period_end = to_timestamp($4)
         WHERE stripe_customer_id = $5`,
        [sub.id, sub.status, plan, sub.current_period_end, sub.customer]
      );
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await db.query(
        `UPDATE users SET subscription_status = 'canceled', subscription_plan = 'free' WHERE stripe_customer_id = $1`,
        [sub.customer]
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await db.query(
        `UPDATE users SET subscription_status = 'past_due' WHERE stripe_customer_id = $1`,
        [invoice.customer]
      );
      break;
    }
  }

  return event;
}

module.exports = { createCheckoutSession, createPortalSession, handleWebhook, PLANS };
