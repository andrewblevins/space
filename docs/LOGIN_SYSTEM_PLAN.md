# SPACE Login System Implementation Plan - Cloudflare Pages Edition

## Overview
This document outlines the implementation plan for adding authentication and managed API keys to SPACE Terminal using Cloudflare Pages Functions. The approach uses a single repository architecture optimized for AI-agent development.

## Goals
- Remove client-side API key management
- Add user authentication (Google OAuth + email/password via Supabase)
- Route all API calls through authenticated Cloudflare Pages Functions
- Preserve existing user data and functionality
- Create foundation for future usage tracking and billing

## Architecture Decision
Using a single repository with Cloudflare Pages Functions because:
- Simplified AI agent development (single context)
- Atomic deployments (frontend + backend together)
- Existing Cloudflare Pages deployment already configured
- API keys already stored in Cloudflare environment variables

## Implementation Phases

### Phase 1: Cloudflare Pages Functions Setup
**Estimated Time**: 2-3 hours

#### 1.1 Create Functions Directory Structure
```bash
space/
├── functions/
│   ├── api/
│   │   ├── chat/
│   │   │   ├── claude.js      # Claude API proxy
│   │   │   └── openai.js      # OpenAI API proxy
│   │   └── health.js          # Health check endpoint
│   └── _middleware.js         # Authentication middleware
├── src/                       # Existing frontend code
└── package.json              # Single package.json for both
```

#### 1.2 Move Existing Functions
Copy the already-written Cloudflare functions from `space-backend/functions/` to `space/functions/`:

```javascript
// functions/api/chat/claude.js
export async function onRequestPost(context) {
  try {
    const { messages, max_tokens = 1024, model = 'claude-3-5-sonnet-20241022' } = await context.request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Error communicating with Claude',
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

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
```

### Phase 2: Supabase Authentication Setup
**Estimated Time**: 2-3 hours

#### 2.1 Create Supabase Project
1. Create new project at supabase.com
2. Enable Google OAuth provider
3. Configure redirect URLs for your Cloudflare Pages domain

#### 2.2 Database Schema
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### 2.3 Environment Variables
Add to Cloudflare Pages dashboard:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Phase 3: Authentication Middleware
**Estimated Time**: 2-3 hours

#### 3.1 Create Authentication Middleware
```javascript
// functions/_middleware.js
import { createClient } from '@supabase/supabase-js';

// Skip auth for public routes
const PUBLIC_PATHS = ['/api/health', '/api/auth'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Skip auth for public paths
  if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
    return context.next();
  }

  // Skip auth for non-API routes (let frontend handle)
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  try {
    const supabase = createClient(
      context.env.SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Add user to context for use in functions
    context.user = user;
    return context.next();
  } catch (error) {
    return new Response('Authentication error', { status: 500 });
  }
}
```

#### 3.2 Update API Functions
```javascript
// functions/api/chat/claude.js
export async function onRequestPost(context) {
  // User is now available from middleware
  const userId = context.user.id;
  
  try {
    const { messages, max_tokens = 1024, model = 'claude-3-5-sonnet-20241022' } = await context.request.json();

    // Log usage for this user (future feature)
    console.log(`User ${userId} calling Claude API`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Error communicating with Claude',
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

### Phase 4: Frontend Authentication Integration
**Estimated Time**: 3-4 hours

#### 4.1 Install Dependencies
```bash
npm install @supabase/supabase-js
```

#### 4.2 Create Supabase Client
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 4.3 Create Auth Context
```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      session,
      signInWithGoogle,
      signInWithEmail,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 4.4 Create Login Component
```javascript
// src/components/LoginScreen.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signInWithGoogle, signInWithEmail, signUp } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 p-8 rounded-lg border border-green-500 max-w-md w-full">
        <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">
          Welcome to SPACE Terminal
        </h1>
        
        {error && (
          <div className="bg-red-900 border border-red-500 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-black py-2 px-4 rounded mb-4 font-medium hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="text-center text-gray-400 mb-4">or</div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-green-500 text-green-400 p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-green-500 text-green-400 p-2 rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-black py-2 px-4 rounded font-medium hover:bg-green-400 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-green-400 mt-4 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
```

#### 4.5 Update App.jsx
```javascript
// src/App.jsx
import { AuthProvider } from './contexts/AuthContext';
import { ModalProvider } from './contexts/ModalContext';
import Terminal from './components/Terminal';
import LoginScreen from './components/LoginScreen';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <ModalProvider>
      <Terminal />
    </ModalProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

#### 4.6 Update API Configuration
```javascript
// src/utils/apiConfig.js
export const getApiEndpoint = () => {
  // Use relative path for Cloudflare Pages Functions
  return '';  // Empty string means same origin
}
```

#### 4.7 Update useClaude Hook
```javascript
// src/hooks/useClaude.js
import { useAuth } from '../contexts/AuthContext';
import { getApiEndpoint } from '../utils/apiConfig';

export function useClaude({ messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt }) {
  const { session } = useAuth();
  
  const callClaude = useCallback(async (userMessage, customGetSystemPrompt = null) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    // ... existing logic ...

    const response = await fetch(`${getApiEndpoint()}/api/chat/claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    });

    // ... rest of existing logic ...
  }, [messages, setMessages, maxTokens, contextLimit, memory, debugMode, reasoningMode, getSystemPrompt, session]);

  return { callClaude };
}
```

### Phase 5: Migration Path
**Estimated Time**: 1-2 hours

#### 5.1 Gradual Migration
1. Deploy authentication system alongside existing direct API access
2. Add feature flag to toggle between old and new system
3. Test with small group of users
4. Migrate all users once stable

#### 5.2 Local Development
```javascript
// .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_AUTH=true  # Feature flag
```

#### 5.3 Preserve Existing Data
- Keep ApiKeySetup component for now
- Add "Import from Browser" option in user settings
- Allow users to export their data before switching

## Testing Strategy

### Local Testing
```bash
# Install Cloudflare Pages CLI
npm install -g wrangler

# Run functions locally
wrangler pages dev --compatibility-date=2024-01-01

# Frontend will proxy to local functions
```

### Integration Testing
1. Test Google OAuth flow
2. Test email/password authentication
3. Verify API calls work with auth tokens
4. Test error handling for expired tokens
5. Verify CORS headers work correctly

## Deployment Steps

1. **Add Supabase environment variables** to Cloudflare Pages
2. **Push code** to trigger automatic deployment
3. **Test authentication flow** on preview URL
4. **Enable for production** once verified

## Benefits of This Approach

1. **Single Repository**: Everything in one place for AI agents
2. **Automatic Deployments**: Push to deploy both frontend and backend
3. **Shared Types**: Can share TypeScript types between frontend and functions
4. **Local Development**: Easy to test full stack locally
5. **Cost Effective**: Cloudflare Pages Functions are very affordable

## Future Enhancements

1. **Usage Tracking**: Log API calls per user in Supabase
2. **Rate Limiting**: Implement per-user rate limits
3. **Billing Integration**: Add Stripe for premium features
4. **Session Management**: Store conversations in Supabase
5. **Team Accounts**: Share sessions within organizations

## Migration Checklist

- [ ] Create Supabase project
- [ ] Move functions to space/functions directory
- [ ] Add authentication middleware
- [ ] Create login UI components
- [ ] Update API calls to use auth tokens
- [ ] Add environment variables to Cloudflare
- [ ] Test complete flow locally
- [ ] Deploy to preview environment
- [ ] Test in production
- [ ] Remove old API key system (after migration period)

---

This plan is optimized for AI-agent development with a single repository approach, leveraging existing Cloudflare Pages infrastructure while adding proper authentication and security.