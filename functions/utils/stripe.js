/**
 * Stripe utility functions for SPACE Terminal
 * Handles Stripe API interactions
 */

import Stripe from 'stripe';

/**
 * Initialize Stripe client
 */
export function getStripeClient(secretKey) {
  if (!secretKey) {
    throw new Error('Stripe secret key is required');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateCustomer(stripe, email, userId, metadata = {}) {
  // Check if customer already exists in Stripe
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email: email,
    metadata: {
      user_id: userId,
      ...metadata,
    },
  });
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(stripe, customerId, priceId, successUrl, cancelUrl, metadata = {}) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: metadata,
    subscription_data: {
      metadata: metadata,
    },
  });
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSession(stripe, customerId, returnUrl) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Cancel subscription (at period end or immediately)
 */
export async function cancelSubscription(stripe, subscriptionId, cancelAtPeriodEnd = true) {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(stripe, subscriptionId) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(stripe, subscriptionId, newPriceId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(stripe, subscriptionId) {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'items.data.price'],
  });
}

/**
 * Handle Stripe webhook event
 */
export async function handleWebhookEvent(stripe, payload, signature, webhookSecret) {
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  return event;
}

/**
 * Map Stripe subscription status to our tier
 */
export function getTierFromSubscriptionStatus(status) {
  if (status === 'active' || status === 'trialing') {
    return 'premium';
  }
  return 'free';
}

/**
 * Map Stripe subscription to our subscription object
 */
export function mapStripeSubscriptionToSubscription(stripeSubscription) {
  return {
    id: stripeSubscription.id,
    status: stripeSubscription.status,
    tier: getTierFromSubscriptionStatus(stripeSubscription.status),
    current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    canceled_at: stripeSubscription.canceled_at 
      ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
      : null,
  };
}

