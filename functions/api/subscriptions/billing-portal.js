/**
 * Create billing portal session for managing subscription
 * POST /api/subscriptions/billing-portal
 */

import { verifyAuth } from '../../utils/auth.js';
import { getStripeClient, createBillingPortalSession } from '../../utils/stripe.js';
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

  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user's subscription to find Stripe customer ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Initialize Stripe
    const stripe = getStripeClient(context.env.STRIPE_SECRET_KEY);

    // Get base URL from request
    const origin = context.request.headers.get('origin') || 'https://spaceterminal.xyz';
    const returnUrl = `${origin}/settings`;

    // Create billing portal session
    const session = await createBillingPortalSession(
      stripe,
      subscription.stripe_customer_id,
      returnUrl
    );

    return new Response(
      JSON.stringify({
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
    console.error('Error creating billing portal session:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create billing portal session',
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

