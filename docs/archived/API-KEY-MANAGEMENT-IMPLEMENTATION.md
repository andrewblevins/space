# API Key Management Implementation

*Step-by-step guide for implementing user-provided API keys*

---

## Overview

This document provides a complete implementation plan for allowing users to provide their own API keys, eliminating your API costs while maintaining a great user experience.

---

## Architecture

### Flow
1. User enters API keys in settings
2. Keys stored securely (encrypted)
3. Frontend sends keys with API requests (via headers)
4. Backend uses user keys instead of env keys
5. Fallback to env keys if user hasn't provided theirs

### Security Considerations
- Keys encrypted at rest
- Keys sent via secure headers (not URL params)
- Keys never logged
- User can only access their own keys

---

## Step 1: Database Schema

### Option A: Store in Supabase (Recommended)

```sql
-- Add to Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  anthropic_key_encrypted TEXT,
  openai_key_encrypted TEXT,
  gemini_key_encrypted TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

-- RLS Policies
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);
```

### Option B: Encrypted localStorage (Simpler, but less secure)

Use existing `src/utils/secureStorage.js` - no database needed, but keys only on one device.

---

## Step 2: Frontend API Key Management Component

### Create `src/components/ApiKeySettings.jsx`

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

export function ApiKeySettings() {
  const { session } = useAuth();
  const [keys, setKeys] = useState({
    anthropic: '',
    openai: '',
    gemini: '',
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [errors, setErrors] = useState({});

  // Load existing keys on mount
  useEffect(() => {
    loadKeys();
  }, [session]);

  const loadKeys = async () => {
    if (!session) return;
    
    try {
      const response = await fetch(`${getApiEndpoint()}/api/user/keys`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Don't show full keys, just indicate they're set
        setKeys({
          anthropic: data.anthropic ? '••••••••' : '',
          openai: data.openai ? '••••••••' : '',
          gemini: data.gemini ? '••••••••' : '',
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`${getApiEndpoint()}/api/user/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(keys),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrors(error);
        return;
      }

      // Success
      alert('API keys saved successfully!');
    } catch (error) {
      setErrors({ general: 'Failed to save API keys' });
    } finally {
      setSaving(false);
    }
  };

  const testKey = async (provider) => {
    setTesting({ ...testing, [provider]: true });

    try {
      const response = await fetch(`${getApiEndpoint()}/api/user/keys/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider, key: keys[provider] }),
      });

      const result = await response.json();
      
      if (result.valid) {
        alert(`${provider} key is valid!`);
      } else {
        alert(`Invalid ${provider} key: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to test ${provider} key`);
    } finally {
      setTesting({ ...testing, [provider]: false });
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-green-400 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">API Key Settings</h2>
      
      <p className="text-gray-400 mb-6">
        Enter your API keys to use SPACE Terminal. Your keys are encrypted and stored securely.
        You only need to provide keys for the services you want to use.
      </p>

      <div className="space-y-4">
        {/* Anthropic Key */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Anthropic API Key (Claude)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keys.anthropic}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded text-green-400"
            />
            <button
              onClick={() => testKey('anthropic')}
              disabled={testing.anthropic || !keys.anthropic}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
            >
              {testing.anthropic ? 'Testing...' : 'Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your key at{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* OpenAI Key */}
        <div>
          <label className="block text-sm font-medium mb-2">
            OpenAI API Key (GPT-4)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keys.openai}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="sk-proj-..."
              className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded text-green-400"
            />
            <button
              onClick={() => testKey('openai')}
              disabled={testing.openai || !keys.openai}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
            >
              {testing.openai ? 'Testing...' : 'Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your key at{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Gemini Key */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Google Gemini API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={keys.gemini}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              placeholder="AIza..."
              className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded text-green-400"
            />
            <button
              onClick={() => testKey('gemini')}
              disabled={testing.gemini || !keys.gemini}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700"
            >
              {testing.gemini ? 'Testing...' : 'Test'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your key at{' '}
            <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">
              makersuite.google.com
            </a>
          </p>
        </div>
      </div>

      {errors.general && (
        <div className="mt-4 p-3 bg-red-900 text-red-200 rounded">
          {errors.general}
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-black font-bold rounded hover:bg-green-500"
        >
          {saving ? 'Saving...' : 'Save API Keys'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-900 text-blue-200 rounded">
        <p className="font-bold mb-2">Don't want to manage API keys?</p>
        <p className="text-sm">
          Subscribe for $10/month to use our hosted service. No API keys needed.
        </p>
        <button className="mt-2 px-4 py-2 bg-blue-700 rounded hover:bg-blue-600">
          Learn More
        </button>
      </div>
    </div>
  );
}
```

---

## Step 3: Backend API Endpoints

### Create `functions/api/user/keys.js`

```javascript
import { verifyAuth } from '../../utils/auth.js';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Simple encryption (for production, use proper key management)
function encrypt(text, secretKey) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted, secretKey) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET - Retrieve user's API keys (masked)
export async function onRequestGet(context) {
  const authResult = await verifyAuth(context);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const userId = authResult.user.id;
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('anthropic_key_encrypted, openai_key_encrypted, gemini_key_encrypted')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Return masked keys (just indicate if they exist)
    return new Response(
      JSON.stringify({
        anthropic: data?.anthropic_key_encrypted ? '••••••••' : null,
        openai: data?.openai_key_encrypted ? '••••••••' : null,
        gemini: data?.gemini_key_encrypted ? '••••••••' : null,
      }),
      {
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve API keys' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

// POST - Save user's API keys
export async function onRequestPost(context) {
  const authResult = await verifyAuth(context);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const userId = authResult.user.id;
  const { anthropic, openai, gemini } = await context.request.json();
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const encryptionKey = context.env.API_KEY_ENCRYPTION_SECRET || 'default-key-change-in-production';

  try {
    const keysToSave = {};
    
    if (anthropic) {
      keysToSave.anthropic_key_encrypted = encrypt(anthropic, encryptionKey);
    }
    if (openai) {
      keysToSave.openai_key_encrypted = encrypt(openai, encryptionKey);
    }
    if (gemini) {
      keysToSave.gemini_key_encrypted = encrypt(gemini, encryptionKey);
    }

    const { error } = await supabase
      .from('user_api_keys')
      .upsert(
        {
          user_id: userId,
          ...keysToSave,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to save API keys' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}

// Test API key endpoint
export async function onRequestPut(context) {
  const authResult = await verifyAuth(context);
  if (!authResult.success) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { provider, key } = await context.request.json();

  try {
    // Test the key by making a simple API call
    let valid = false;
    let error = null;

    if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      valid = response.ok;
      if (!valid) {
        const data = await response.json();
        error = data.error?.message || 'Invalid key';
      }
    } else if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      valid = response.ok;
      if (!valid) {
        const data = await response.json();
        error = data.error?.message || 'Invalid key';
      }
    } else if (provider === 'gemini') {
      // Test Gemini key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
      valid = response.ok;
      if (!valid) {
        error = 'Invalid key';
      }
    }

    return new Response(
      JSON.stringify({ valid, error }),
      {
        headers: { 'content-type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }
    );
  }
}
```

---

## Step 4: Update Chat API to Use User Keys

### Modify `functions/api/chat/claude.js`

```javascript
// Add at the top
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function decrypt(encrypted, secretKey) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function getUserApiKey(context, userId, provider) {
  const supabase = createClient(
    context.env.SUPABASE_URL,
    context.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data } = await supabase
    .from('user_api_keys')
    .select(`${provider}_key_encrypted`)
    .eq('user_id', userId)
    .single();

  if (!data || !data[`${provider}_key_encrypted`]) {
    return null;
  }

  const encryptionKey = context.env.API_KEY_ENCRYPTION_SECRET || 'default-key-change-in-production';
  return decrypt(data[`${provider}_key_encrypted`], encryptionKey);
}

// In onRequestPost function, before making API call:
const userAnthropicKey = await getUserApiKey(context, userId, 'anthropic');
const apiKey = userAnthropicKey || context.env.ANTHROPIC_API_KEY;

// Use apiKey instead of context.env.ANTHROPIC_API_KEY
```

---

## Step 5: Add to Settings Menu

### Update `src/components/SettingsMenu.jsx`

Add API Key Settings section:

```jsx
import { ApiKeySettings } from './ApiKeySettings';

// In the settings menu, add:
<ApiKeySettings />
```

---

## Step 6: Onboarding Flow

### Create `src/components/OnboardingApiKeys.jsx`

Show this to first-time users:

```jsx
export function OnboardingApiKeys({ onComplete }) {
  return (
    <div className="modal-content">
      <h2>Welcome to SPACE Terminal</h2>
      <p>To get started, you'll need to provide API keys for the AI services you want to use.</p>
      
      <ApiKeySettings />
      
      <button onClick={onComplete}>Continue</button>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] User can enter API keys
- [ ] Keys are encrypted and stored securely
- [ ] Keys are used for API calls
- [ ] Fallback to env keys if user hasn't provided theirs
- [ ] Test key validation works
- [ ] Error handling for invalid keys
- [ ] Keys are masked when displayed
- [ ] RLS policies prevent access to other users' keys

---

## Security Best Practices

1. **Encryption**: Encrypt keys at rest (use proper key management in production)
2. **HTTPS Only**: Never send keys over HTTP
3. **No Logging**: Never log API keys
4. **RLS**: Use Row Level Security in Supabase
5. **Validation**: Test keys before saving
6. **Rotation**: Allow users to update keys easily

---

## Next Steps

1. Implement API key management component
2. Create backend endpoints
3. Update chat API to use user keys
4. Add to settings menu
5. Test thoroughly
6. Launch with API key requirement
7. Add subscription option later (optional)

---

*This implementation allows you to launch publicly without API costs while maintaining a great user experience.*

