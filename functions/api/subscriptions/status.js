/**
 * Get subscription status for current user
 * GET /api/subscriptions/status
 */

import { verifyAuth } from '../../utils/auth.js';
import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
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

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Get user usage/tier
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('tier, messages_today, last_reset_date')
      .eq('user_id', userId)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }

    // If no subscription, return free tier
    if (subError && subError.code === 'PGRST116') {
      return new Response(
        JSON.stringify({
          tier: usage?.tier || 'free',
          subscription: null,
          usage: usage || {
            tier: 'free',
            messages_today: 0,
            last_reset_date: new Date().toISOString().split('T')[0],
          },
        }),
        {
          headers: {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        tier: subscription.tier,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          tier: subscription.tier,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        usage: usage || {
          tier: subscription.tier,
          messages_today: 0,
          last_reset_date: new Date().toISOString().split('T')[0],
        },
      }),
      {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch subscription status',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

