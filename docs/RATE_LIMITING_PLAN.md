# SPACE Terminal - Rate Limiting Implementation Plan

## Overview
This document outlines the implementation of a message-based rate limiting system for SPACE Terminal, mirroring Claude's user experience with daily message limits, soft warnings, and graceful degradation.

## Goals
- **Cost Control**: Limit API costs to ~$10/month for free users
- **Scalability**: Handle 10s of users now, scale to 100s+ later
- **User Experience**: Mirror Claude's transparent but non-intrusive approach
- **Business Model**: Enable free tier + paid tier structure

## Rate Limiting Strategy

### **MVP Limits Structure (Everyone Free with High Limits)**
```
All Users:  500 messages/day (generous free tier)
Reset:      Daily at midnight UTC
Tracking:   Message count (not tokens)
Tier:       Everyone starts as 'free' but gets high limits
```

### **Future Limits Structure (When Subscriptions Added)**
```
Free Tier:  50 messages/day
Paid Tier:  500 messages/day
Reset:      Daily at midnight UTC
Tracking:   Message count (not tokens)
```

### **What Gets Limited**
- ✅ **Main Claude conversations** (expensive, primary feature)
- ❌ **Metaphors analysis** (background feature, relatively cheap)
- ❌ **Advisor suggestions** (background feature, relatively cheap)
- ❌ **OpenAI calls** (cheap compared to Claude)

### **User Experience Design**
Following Claude's model:
- **Transparent usage tracking** - Always visible in UI
- **Soft warnings** at 80% usage (40/50 messages)
- **Approach warning** at 90% usage (45/50 messages)
- **Graceful degradation** when limits hit (warnings, not blocking)
- **Daily reset messaging** - "Your limit resets in X hours"

## Technical Implementation

### Phase 1: Database Schema

#### **1.1 Supabase Table Creation**
```sql
-- User usage tracking table
CREATE TABLE public.user_usage (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  messages_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  tier TEXT DEFAULT 'free', -- 'free' or 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can only access their own usage
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions can insert new user records
CREATE POLICY "Service role can insert usage" ON public.user_usage
  FOR INSERT WITH CHECK (true);

-- Function to reset daily usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.user_usage 
  SET 
    messages_today = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
```

#### **1.2 Automatic Daily Reset**
```sql
-- Create a daily cron job (Supabase Edge Functions)
-- Or manual reset via API call
SELECT cron.schedule(
  'reset-daily-usage',
  '0 0 * * *', -- Daily at midnight UTC
  'SELECT reset_daily_usage();'
);
```

### Phase 2: Backend Middleware Updates

#### **2.1 Rate Limiting Middleware**
```javascript
// functions/middleware/rateLimiting.js
import { createClient } from '@supabase/supabase-js';

// MVP Configuration - Everyone gets high limits
const RATE_LIMITS = {
  free: 500,  // Generous MVP limits for all users
  paid: 500   // Same for now, ready to differentiate later
};

// Future Configuration - When subscriptions are added
// const RATE_LIMITS = {
//   free: 50,   // Actual free tier limits
//   paid: 500   // Pro tier limits
// };

export async function checkRateLimit(context, userId) {
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get or create user usage record
  let { data: usage, error } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Create new user record
    const { data: newUsage, error: createError } = await supabase
      .from('user_usage')
      .insert({ user_id: userId })
      .select()
      .single();
    
    if (createError) throw createError;
    usage = newUsage;
  } else if (error) {
    throw error;
  }

  // Check if we need to reset daily count
  const today = new Date().toISOString().split('T')[0];
  if (usage.last_reset_date !== today) {
    const { data: resetUsage, error: resetError } = await supabase
      .from('user_usage')
      .update({
        messages_today: 0,
        last_reset_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (resetError) throw resetError;
    usage = resetUsage;
  }

  const limit = RATE_LIMITS[usage.tier] || RATE_LIMITS.free;
  const remaining = limit - usage.messages_today;

  return {
    usage: usage.messages_today,
    limit,
    remaining,
    tier: usage.tier,
    canProceed: remaining > 0
  };
}

export async function incrementUsage(context, userId) {
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase
    .from('user_usage')
    .update({
      messages_today: supabase.raw('messages_today + 1'),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) throw error;
}
```

#### **2.2 Update Claude Function**
```javascript
// functions/api/chat/claude.js
import { checkRateLimit, incrementUsage } from '../middleware/rateLimiting.js';

export async function onRequestPost(context) {
  const userId = context.user?.id;
  
  try {
    // Check rate limit before processing
    const rateLimitInfo = await checkRateLimit(context, userId);
    
    // Log usage info for monitoring
    console.log(`User ${userId} usage: ${rateLimitInfo.usage}/${rateLimitInfo.limit}`);

    const requestBody = await context.request.json();

    // Proceed with API call (even if over limit for now - soft enforcement)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Increment usage after successful API call
    if (response.ok) {
      await incrementUsage(context, userId);
    }

    // Include rate limit info in response headers
    const responseHeaders = {
      'content-type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
      'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
      'X-RateLimit-Used': rateLimitInfo.usage.toString(),
      'X-RateLimit-Tier': rateLimitInfo.tier
    };

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request even if rate limiting fails
    return new Response(JSON.stringify({
      error: 'Rate limiting error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
```

#### **2.3 Usage Query Endpoint**
```javascript
// functions/api/usage.js
export async function onRequestGet(context) {
  const userId = context.user?.id;
  
  try {
    const rateLimitInfo = await checkRateLimit(context, userId);
    
    // Calculate time until reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const hoursUntilReset = Math.ceil((tomorrow - now) / (1000 * 60 * 60));

    return new Response(JSON.stringify({
      usage: rateLimitInfo.usage,
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      tier: rateLimitInfo.tier,
      resetIn: `${hoursUntilReset} hours`,
      resetTime: tomorrow.toISOString()
    }), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch usage',
      message: error.message
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
```

### Phase 3: Frontend Integration

#### **3.1 Usage Tracking Hook**
```javascript
// src/hooks/useUsageTracking.js
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

export function useUsageTracking() {
  const { session } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${getApiEndpoint()}/api/usage`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [session]);

  // Update usage from API response headers
  const updateFromHeaders = (response) => {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const used = response.headers.get('X-RateLimit-Used');
    const tier = response.headers.get('X-RateLimit-Tier');

    if (limit && remaining && used) {
      setUsage({
        usage: parseInt(used),
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        tier: tier || 'free'
      });
    }
  };

  return {
    usage,
    loading,
    refreshUsage: fetchUsage,
    updateFromHeaders
  };
}
```

#### **3.2 Usage Display Component**
```javascript
// src/components/UsageIndicator.jsx
import { useUsageTracking } from '../hooks/useUsageTracking';

export default function UsageIndicator() {
  const { usage, loading } = useUsageTracking();

  if (loading || !usage) return null;

  const percentage = (usage.usage / usage.limit) * 100;
  const isApproachingLimit = percentage >= 80;
  const isNearLimit = percentage >= 90;

  return (
    <div className={`text-sm px-3 py-1 rounded ${
      isNearLimit ? 'bg-red-900 text-red-400' :
      isApproachingLimit ? 'bg-yellow-900 text-yellow-400' :
      'bg-gray-800 text-gray-400'
    }`}>
      {usage.usage}/{usage.limit} messages today
      {isApproachingLimit && (
        <div className="text-xs mt-1">
          {isNearLimit ? 'Approaching daily limit' : 'Consider upgrading'}
        </div>
      )}
    </div>
  );
}
```

#### **3.3 Update useClaude Hook**
```javascript
// Add to src/hooks/useClaude.js
import { useUsageTracking } from './useUsageTracking';

export function useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt }) {
  const { updateFromHeaders } = useUsageTracking();
  
  const callClaude = useCallback(async (userMessage, customGetSystemPrompt = null) => {
    // ... existing logic ...

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    // Update usage from response headers
    updateFromHeaders(response);

    // ... rest of existing logic ...
  }, [/* ... existing dependencies ..., updateFromHeaders */]);

  return { callClaude };
}
```

#### **3.4 Add to Settings Menu**
```javascript
// Update src/components/SettingsMenu.jsx
import UsageIndicator from './UsageIndicator';

// Add to the settings menu JSX:
<div className="mb-4">
  <h3 className="text-sm font-medium text-green-400 mb-2">Usage</h3>
  <UsageIndicator />
</div>
```

### Phase 4: Warning System

#### **4.1 Warning Toast Component**
```javascript
// src/components/UsageWarningToast.jsx
import { useState, useEffect } from 'react';
import { useUsageTracking } from '../hooks/useUsageTracking';

export default function UsageWarningToast() {
  const { usage } = useUsageTracking();
  const [showWarning, setShowWarning] = useState(false);
  const [lastWarnedAt, setLastWarnedAt] = useState(0);

  useEffect(() => {
    if (!usage) return;

    const percentage = (usage.usage / usage.limit) * 100;
    const shouldWarn = percentage >= 80;
    const timeSinceLastWarning = Date.now() - lastWarnedAt;
    
    // Show warning if approaching limit and haven't warned in last 10 minutes
    if (shouldWarn && timeSinceLastWarning > 10 * 60 * 1000) {
      setShowWarning(true);
      setLastWarnedAt(Date.now());
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShowWarning(false), 5000);
    }
  }, [usage, lastWarnedAt]);

  if (!showWarning || !usage) return null;

  const percentage = (usage.usage / usage.limit) * 100;

  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-900 border border-yellow-500 text-yellow-400 p-4 rounded-lg shadow-lg max-w-sm">
      <div className="flex items-start">
        <div className="flex-1">
          <h4 className="font-medium">Approaching Daily Limit</h4>
          <p className="text-sm mt-1">
            You've used {usage.usage} of {usage.limit} messages today ({percentage.toFixed(0)}%).
          </p>
          {usage.tier === 'free' && (
            <p className="text-xs mt-2">
              Consider upgrading for higher limits.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="ml-3 text-yellow-400 hover:text-yellow-300"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

#### **4.2 Add to App.jsx**
```javascript
// Add to src/App.jsx
import UsageWarningToast from './components/UsageWarningToast';

function AppContent() {
  // ... existing code ...

  return (
    <>
      <ModalProvider>
        <Terminal theme={theme} toggleTheme={toggleTheme} />
      </ModalProvider>
      <UsageWarningToast />
    </>
  );
}
```

## Implementation Timeline

### **Day 1: Backend Setup (2-3 hours)**
- [ ] Create Supabase table and policies
- [ ] Implement rate limiting middleware
- [ ] Update Claude API function
- [ ] Create usage endpoint

### **Day 2: Frontend Integration (2-3 hours)**
- [ ] Create usage tracking hook
- [ ] Add usage indicator to settings
- [ ] Update useClaude hook
- [ ] Test integration

### **Day 3: Warning System (1-2 hours)**
- [ ] Implement warning toast
- [ ] Add to app layout
- [ ] Test warning thresholds
- [ ] Deploy and monitor

## Testing Strategy

### **Test Cases**
1. **New user usage tracking**
   - Verify usage record created on first API call
   - Check daily reset functionality

2. **Limit enforcement**
   - Test soft warnings at 80% and 90%
   - Verify headers returned correctly
   - Check usage increment accuracy

3. **Daily reset**
   - Test midnight UTC reset
   - Verify usage counter resets to 0

4. **Error handling**
   - Test rate limiting failures (fail open)
   - Check API calls still work if usage system fails

### **Monitoring**
- [ ] Cloudflare Functions logs for usage tracking
- [ ] Supabase dashboard for usage data
- [ ] Alert when total daily usage approaches cost thresholds

## Future Enhancements

### **Phase 2 Features**
- **Hard limits**: Block requests when limits exceeded
- **Paid tier management**: Stripe integration for upgrades
- **Usage analytics**: Admin dashboard for monitoring costs
- **Feature-specific limits**: Different limits for Extended Thinking
- **Rolling windows**: 24-hour rolling limits instead of daily reset

### **Business Model Evolution**
- **Free tier**: 50 messages/day
- **Starter tier**: $10/month, 500 messages/day
- **Pro tier**: $25/month, 2000 messages/day
- **Enterprise**: Custom limits and pricing

## Cost Analysis

### **Expected Costs (50 free messages/day)**
- **Claude API**: ~$0.10 per message average
- **10 users × 50 messages × $0.10**: $50/day = $1,500/month
- **Target**: $10/month means ~3 messages per user per day sustainable

### **Optimization Strategies**
- **Encourage paid tiers**: Aggressive upgrade prompts
- **Feature gating**: Limit expensive features (Extended Thinking) to paid
- **Smart caching**: Cache similar responses to reduce API calls
- **Model optimization**: Use cheaper models for certain tasks

---

## MVP Implementation (Start Here)

### **MVP Strategy: Everyone Free with High Limits**

**Goal**: Get rate limiting infrastructure working with generous limits while you validate the system and prepare for monetization.

#### **MVP Configuration**
- **All users**: 500 messages/day (same as future "Pro" tier)
- **Everyone starts**: As 'free' tier in database
- **No payments**: Zero friction signup and usage
- **Full tracking**: See exactly how much users are costing you
- **Ready to scale**: Easy to change limits and add tiers later

#### **Benefits of MVP Approach**
1. **Immediate cost visibility** - Track total API usage across all users
2. **User engagement** - Users see and understand the usage system
3. **Zero friction** - No payments, tier selection, or signup barriers
4. **Smooth transition** - When you add subscriptions, users already understand limits
5. **Infrastructure tested** - Rate limiting system proven before monetization

#### **MVP Implementation Checklist**
- [ ] Set up Supabase `user_usage` table
- [ ] Implement rate limiting middleware with 500 message limit
- [ ] Add usage tracking to Claude API calls
- [ ] Create usage display in settings menu
- [ ] Add warning system (even at high limits)
- [ ] Test complete flow end-to-end

#### **When Ready to Add Subscriptions**
1. **Change limits**: Update `RATE_LIMITS.free` from 500 to 50
2. **Add Stripe**: Implement subscription system from tier plan
3. **Grandfather users**: Decide how to handle existing users
   - Option A: All existing users become "Pro" for free
   - Option B: Give existing users 30-day notice before limits change
   - Option C: Immediate change with upgrade prompts

#### **MVP Cost Analysis**
- **500 messages/day per user**: ~$50/day per active user
- **10 active users**: $500/day = $15,000/month
- **Reality check**: Most users won't hit 500 messages/day
- **Monitoring**: Track actual usage to set realistic paid tier limits

#### **Transition Path**
```
MVP (Today):        All users → 500 messages/day free
Subscriptions V1:   Free: 50/day, Pro: 500/day, $10/month  
Subscriptions V2:   Free: 50/day, Pro: 1000/day, Enterprise: unlimited
```

**This MVP gives you complete cost control and user engagement while keeping all doors open for future monetization strategies.**

---

This plan provides a complete rate limiting system that mirrors Claude's user experience while giving you cost control and a foundation for monetization.