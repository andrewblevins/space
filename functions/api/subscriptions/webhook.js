/**
 * Stripe webhook handler for subscription events
 * POST /api/subscriptions/webhook
 * 
 * Handles:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { getStripeClient, handleWebhookEvent } from '../../utils/stripe.js';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const signature = context.request.headers.get('stripe-signature');

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }

  try {
    const stripe = getStripeClient(context.env.STRIPE_SECRET_KEY);
    const payload = await context.request.text();

    // Verify webhook signature
    const event = await handleWebhookEvent(
      stripe,
      payload,
      signature,
      context.env.STRIPE_WEBHOOK_SECRET
    );

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoiceFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Webhook handler failed',
        message: error.message,
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutCompleted(supabase, session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || 'premium';

  if (!userId) {
    console.error('No user_id in checkout session metadata');
    return;
  }

  // Retrieve subscription from Stripe
  const stripe = getStripeClient(context.env.STRIPE_SECRET_KEY);
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Create or update subscription in database
  await handleSubscriptionUpdated(supabase, subscription);
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionUpdated(supabase, subscription) {
  const userId = subscription.metadata?.user_id;
  const tier = subscription.metadata?.tier || 'premium';

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Upsert subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        tier: tier,
        price_id: subscription.items.data[0]?.price?.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        metadata: subscription.metadata,
      },
      {
        onConflict: 'stripe_subscription_id',
      }
    );

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  // Update user_usage tier (trigger will handle this, but ensure it happens)
  await supabase
    .from('user_usage')
    .upsert(
      {
        user_id: userId,
        tier: subscription.status === 'active' || subscription.status === 'trialing' ? tier : 'free',
      },
      {
        onConflict: 'user_id',
      }
    );
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(supabase, subscription) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update user tier to free (trigger will handle this)
  await supabase
    .from('user_usage')
    .update({ tier: 'free' })
    .eq('user_id', userId);
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaid(supabase, invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Get subscription to find user_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  // Record billing history
  await supabase.from('billing_history').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent,
    amount_cents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    invoice_url: invoice.hosted_invoice_url,
    paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
  });
}

/**
 * Handle invoice payment failed
 */
async function handleInvoiceFailed(supabase, invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Get subscription to find user_id
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!subscription) return;

  // Record billing history
  await supabase.from('billing_history').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent,
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    invoice_url: invoice.hosted_invoice_url,
  });
}

