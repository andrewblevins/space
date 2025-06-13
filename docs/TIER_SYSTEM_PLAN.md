# SPACE Terminal - Tier System Implementation Plan

## Overview
This document outlines the implementation of a two-tier subscription system for SPACE Terminal, with tier selection during signup, Stripe payment integration, and comprehensive subscription management.

## Tier Structure

### **Free Tier**
- **Price**: $0/month
- **Limits**: 50 messages/day
- **Features**: Core SPACE Terminal functionality
- **Target**: Trial users, light usage

### **Pro Tier** 
- **Price**: $10/month
- **Limits**: 500 messages/day  
- **Features**: All Free features + priority support
- **Target**: Regular users, power users

## User Journey

### **Signup Flow**
1. **User visits LoginScreen** → Sees "Sign Up" option
2. **Tier Selection Modal** → Choose Free or Pro before account creation
3. **Account Creation** → Supabase auth + profile creation
4. **Payment Flow** (if Pro selected) → Stripe Checkout
5. **Account Activation** → Access granted based on selected tier

### **Upgrade Flow**
1. **Settings Menu** → New "Subscription" tab
2. **Upgrade to Pro** → Stripe Checkout integration
3. **Instant Activation** → Tier updated immediately after payment
4. **Confirmation** → Usage limits updated, user notified

### **Subscription Management**
1. **Subscription Tab** → View current plan, usage, billing date
2. **Cancel Subscription** → Stripe portal integration
3. **Billing History** → View past invoices
4. **Tier Changes** → Upgrade/downgrade options

## Technical Implementation

### **Database Schema (Scalable Approach)**

#### **User Subscriptions Table**
```sql
-- Subscription management
CREATE TABLE public.user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free' or 'pro'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON public.user_subscriptions(stripe_subscription_id);

-- RLS policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');
```

#### **Update User Usage Table**
```sql
-- Remove tier from user_usage, reference subscription instead
ALTER TABLE public.user_usage DROP COLUMN tier;

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN s.status = 'active' AND s.tier = 'pro' THEN 'pro'
      ELSE 'free'
    END INTO user_tier
  FROM public.user_subscriptions s
  WHERE s.user_id = user_uuid
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Stripe Integration**

#### **Stripe Configuration**
```javascript
// functions/lib/stripe.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_PLANS = {
  pro: {
    price_id: 'price_stripe_pro_monthly', // From Stripe dashboard
    amount: 1000, // $10.00 in cents
    interval: 'month'
  }
};

export { stripe };
```

#### **Subscription Creation Endpoint**
```javascript
// functions/api/subscriptions/create.js
import { stripe, STRIPE_PLANS } from '../../lib/stripe.js';

export async function onRequestPost(context) {
  const userId = context.user?.id;
  const { tier, return_url } = await context.request.json();
  
  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create or get Stripe customer
    let customer;
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingSub?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingSub.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        metadata: { user_id: userId }
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: STRIPE_PLANS[tier].price_id,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: return_url,
      metadata: {
        user_id: userId,
        tier: tier
      }
    });

    return new Response(JSON.stringify({
      checkout_url: session.url,
      session_id: session.id
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Subscription creation failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
```

#### **Stripe Webhook Handler**
```javascript
// functions/api/webhooks/stripe.js
import { stripe } from '../../lib/stripe.js';

export async function onRequestPost(context) {
  const signature = context.request.headers.get('stripe-signature');
  const body = await context.request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      context.env.STRIPE_WEBHOOK_SECRET
    );

    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, supabase);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, supabase);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, supabase);
        break;
    }

    return new Response('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook Error', { status: 400 });
  }
}

async function handleCheckoutCompleted(session, supabase) {
  const userId = session.metadata.user_id;
  const tier = session.metadata.tier;
  
  // Create subscription record
  await supabase.from('user_subscriptions').insert({
    user_id: userId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    tier: tier,
    status: 'active'
  });
}

async function handlePaymentFailed(invoice, supabase) {
  // Update subscription status to past_due
  await supabase
    .from('user_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription);
}
```

### **Frontend Integration**

#### **Tier Selection During Signup**
```javascript
// src/components/TierSelectionModal.jsx
import { useState } from 'react';

export default function TierSelectionModal({ onTierSelected, onClose }) {
  const [selectedTier, setSelectedTier] = useState('free');

  const tiers = {
    free: {
      name: 'Free',
      price: '$0',
      messages: 50,
      features: ['Core SPACE Terminal', 'Basic support']
    },
    pro: {
      name: 'Pro',
      price: '$10',
      messages: 500,
      features: ['All Free features', 'Priority support', 'Higher limits']
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
          Choose Your Plan
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(tiers).map(([key, tier]) => (
            <div
              key={key}
              className={`border rounded-lg p-6 cursor-pointer transition-colors ${
                selectedTier === key
                  ? 'border-green-500 bg-green-900 bg-opacity-20'
                  : 'border-gray-600 hover:border-green-400'
              }`}
              onClick={() => setSelectedTier(key)}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-400">{tier.name}</h3>
                <div className="text-3xl font-bold text-white mt-2">{tier.price}</div>
                <div className="text-gray-400 text-sm">per month</div>
                <div className="text-green-400 font-medium mt-4">
                  {tier.messages} messages/day
                </div>
              </div>
              
              <ul className="mt-4 space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="text-gray-300 text-sm flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-600 text-gray-400 rounded hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onTierSelected(selectedTier)}
            className="px-6 py-2 bg-green-500 text-black rounded font-medium hover:bg-green-400"
          >
            Continue with {tiers[selectedTier].name}
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### **Subscription Management Tab**
```javascript
// src/components/SubscriptionTab.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionTab() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tier: 'pro',
          return_url: window.location.origin
        })
      });
      
      const { checkout_url } = await response.json();
      window.location.href = checkout_url;
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  if (loading) return <div>Loading subscription...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-green-400">Subscription</h3>
      
      {subscription ? (
        <div className="border border-gray-600 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium text-white capitalize">{subscription.tier} Plan</h4>
              <p className="text-sm text-gray-400">
                {subscription.tier === 'pro' ? '$10/month' : 'Free'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Messages per day</div>
              <div className="font-medium text-green-400">
                {subscription.tier === 'pro' ? '500' : '50'}
              </div>
            </div>
          </div>

          {subscription.tier === 'free' ? (
            <button
              onClick={handleUpgrade}
              className="w-full bg-green-500 text-black py-2 rounded font-medium hover:bg-green-400"
            >
              Upgrade to Pro
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
              <button
                onClick={() => {/* Open Stripe portal */}}
                className="text-sm text-green-400 hover:underline"
              >
                Manage subscription
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No active subscription</p>
          <button
            onClick={handleUpgrade}
            className="bg-green-500 text-black px-6 py-2 rounded font-medium hover:bg-green-400"
          >
            Start Pro Plan
          </button>
        </div>
      )}
    </div>
  );
}
```

## Implementation Strategy

### **MVP Approach (Start Here)**
For initial implementation, we'll use the simple approach from the rate limiting plan:
- Store tier in `user_usage.tier` column
- All users start as 'free'
- Manual tier upgrades via database
- No payment integration initially

### **Full Implementation Timeline**

#### **Phase 1: Database & Backend (Week 1)**
- [ ] Create user_subscriptions table
- [ ] Set up Stripe account and products
- [ ] Implement subscription creation endpoint
- [ ] Set up webhook handling

#### **Phase 2: Frontend Integration (Week 2)**
- [ ] Create tier selection modal
- [ ] Add subscription tab to settings
- [ ] Implement upgrade flow
- [ ] Test Stripe integration

#### **Phase 3: Management Features (Week 3)**
- [ ] Subscription cancellation
- [ ] Billing portal integration
- [ ] Tier verification optimization
- [ ] Grace period handling

### **Tier Verification Strategy**
- **Real-time**: Check tier on each API call (simple, always accurate)
- **Cached**: Cache tier for 1 hour, refresh periodically (better performance)
- **Webhook-driven**: Update tier immediately on Stripe events (most efficient)

**Recommendation**: Start with real-time verification, optimize later.

### **Grace Period Best Practices**
- **Payment failure**: 3 days grace period before downgrade
- **Cancellation**: Access until end of billing period
- **Partial month**: Prorated refunds for downgrades
- **Reactivation**: Restore access immediately on payment

## Environment Variables

```bash
# Add to Cloudflare Pages
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Testing Strategy

### **Payment Flow Testing**
- [ ] Use Stripe test mode for development
- [ ] Test successful subscription creation
- [ ] Test failed payments and recovery
- [ ] Test subscription cancellation
- [ ] Test webhook delivery and handling

### **Tier Verification Testing**
- [ ] Verify tier changes reflect immediately
- [ ] Test rate limiting respects new tiers
- [ ] Check grace period behavior
- [ ] Test manual tier overrides

## Cost Analysis

### **Stripe Fees**
- **Processing**: 2.9% + $0.30 per transaction
- **Monthly $10 subscription**: $0.59 fee = $9.41 net
- **Annual optimization**: Offer annual plans to reduce transaction fees

### **Revenue Projections**
- **10 Pro users**: $94.10/month net revenue
- **Cost coverage**: Supports ~940 Claude API calls/month
- **Break-even**: ~19 Claude calls per Pro user per month

---

This comprehensive tier system provides the foundation for sustainable monetization while maintaining a great user experience. The MVP approach lets us start simple and evolve toward the full-featured system.