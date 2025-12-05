# Stripe Payment Processing Setup Guide

*Complete guide for setting up Stripe integration for SPACE Terminal subscriptions*

---

## Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Supabase project with database access
3. Cloudflare Workers/Pages deployment

---

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
- Go to https://stripe.com and sign up
- Complete account verification
- Note: Use test mode for development

### 1.2 Get API Keys
- Go to Developers → API keys
- Copy your **Publishable key** (starts with `pk_`)
- Copy your **Secret key** (starts with `sk_`)
- **Important**: Keep secret key secure, never commit to git

### 1.3 Create Products and Prices

#### Premium Subscription
1. Go to Products → Add product
2. Name: "SPACE Terminal Premium"
3. Description: "Premium features including expert knowledge advisors, advanced analytics, and 10x message limits"
4. Pricing:
   - **Monthly**: $15/month (or $20/month)
   - **Annual**: $150/year (or $180/year) - 20% discount
5. Copy the **Price ID** (starts with `price_`)

#### Coaching Package (Optional)
1. Create another product: "SPACE Terminal Coaching Package"
2. Pricing: $300/month (or your coaching rate)
3. Copy the **Price ID**

### 1.4 Set Up Webhook
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/subscriptions/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

---

## Step 2: Database Setup

### 2.1 Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `database/subscriptions-schema.sql`
3. Verify tables were created:
   - `subscriptions`
   - `user_usage`
   - `payment_methods`
   - `billing_history`

### 2.2 Verify RLS Policies
- Check that Row Level Security is enabled
- Verify policies allow users to access their own data

---

## Step 3: Environment Variables

### 3.1 Cloudflare Workers/Pages
Add these environment variables in Cloudflare Dashboard:

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_... (for frontend)
```

### 3.2 Local Development (wrangler.toml)
Add to `wrangler.toml`:

```toml
[vars]
STRIPE_SECRET_KEY = "sk_test_..."
STRIPE_WEBHOOK_SECRET = "whsec_..."
STRIPE_PUBLISHABLE_KEY = "pk_test_..."
```

**Important**: Never commit `wrangler.toml` with real keys. Use `wrangler.toml.example` as template.

---

## Step 4: Install Dependencies

```bash
npm install stripe
```

---

## Step 5: Frontend Integration

### 5.1 Create Subscription Component
See `src/components/SubscriptionManager.jsx` (to be created)

### 5.2 Add Stripe.js to Frontend
Add to `index.html` or use npm package:

```html
<script src="https://js.stripe.com/v3/"></script>
```

Or install:
```bash
npm install @stripe/stripe-js
```

---

## Step 6: Testing

### 6.1 Test Mode
- Use Stripe test mode for development
- Test card numbers:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`
- Use any future expiry date, any CVC, any ZIP

### 6.2 Test Webhook Locally
Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/subscriptions/webhook
```

This gives you a webhook signing secret for local testing.

### 6.3 Test Flow
1. User clicks "Upgrade to Premium"
2. Redirected to Stripe Checkout
3. Complete payment with test card
4. Webhook receives `checkout.session.completed`
5. Subscription created in database
6. User tier updated to `premium`
7. Rate limits increased to 1000/day

---

## Step 7: Production Deployment

### 7.1 Switch to Live Mode
1. Get live API keys from Stripe Dashboard
2. Update environment variables in Cloudflare
3. Update webhook endpoint URL to production domain
4. Test with real card (use small amount first)

### 7.2 Monitor Webhooks
- Check Stripe Dashboard → Webhooks for delivery status
- Set up error alerts
- Monitor failed webhook deliveries

---

## API Endpoints

### Create Checkout Session
```
POST /api/subscriptions/create-checkout
Body: { priceId: "price_...", tier: "premium" }
Returns: { sessionId: "...", url: "..." }
```

### Get Subscription Status
```
GET /api/subscriptions/status
Returns: { tier: "premium", subscription: {...}, usage: {...} }
```

### Create Billing Portal Session
```
POST /api/subscriptions/billing-portal
Returns: { url: "..." }
```

### Webhook Handler
```
POST /api/subscriptions/webhook
Headers: stripe-signature
Body: Stripe webhook payload
```

---

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is correct
- Verify webhook secret matches
- Check Cloudflare logs for errors
- Use Stripe Dashboard → Webhooks to see delivery attempts

### Subscription Not Updating
- Check database triggers are working
- Verify webhook is processing events
- Check user_usage table for tier updates

### Rate Limits Not Applied
- Verify `checkRateLimit` function reads correct tier
- Check user_usage table has correct tier
- Ensure subscription status is 'active'

---

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Always verify webhook signatures** before processing
3. **Use environment variables** for all secrets
4. **Enable RLS** on all database tables
5. **Validate user input** before creating subscriptions
6. **Log webhook events** for debugging
7. **Monitor failed payments** and handle gracefully

---

## Next Steps

1. Create frontend subscription UI components
2. Add subscription status display
3. Implement upgrade/downgrade flows
4. Add billing history view
5. Set up email notifications for subscription events

---

*This guide should be updated as the implementation evolves.*

