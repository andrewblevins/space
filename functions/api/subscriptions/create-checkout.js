/**
 * Create Stripe checkout session for subscription
 * POST /api/subscriptions/create-checkout
 */

import { verifyAuth } from '../../utils/auth.js';
import { getStripeClient, getOrCreateCustomer, createCheckoutSession } from '../../utils/stripe.js';
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  // Verify authentication
  const authResult = await verifyAuth(context);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const userId = authResult.user.id;
  const userEmail = authResult.user.email;

  try {
    const { priceId, tier } = await context.request.json();

    if (!priceId || !tier) {
      return new Response(
        JSON.stringify({ error: 'priceId and tier are required' }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Validate tier
    if (!['premium', 'coaching'].includes(tier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tier. Must be "premium" or "coaching"' }),
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Initialize Stripe
    const stripe = getStripeClient(context.env.STRIPE_SECRET_KEY);

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(stripe, userEmail, userId, {
      tier: tier,
    });

    // Get base URL from request
    const origin = context.request.headers.get('origin') || 'https://spaceterminal.xyz';
    const successUrl = `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/subscription/cancel`;

    // Create checkout session
    const session = await createCheckoutSession(
      stripe,
      customer.id,
      priceId,
      successUrl,
      cancelUrl,
      {
        user_id: userId,
        tier: tier,
      }
    );

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

