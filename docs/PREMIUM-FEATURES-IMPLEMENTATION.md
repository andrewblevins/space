# Premium Features Implementation Plan

*Implementation plan for expert knowledge advisors and advanced analytics*

---

## Overview

Premium features differentiate the paid tier from the free tier and justify the $15-20/month pricing. This document outlines the implementation plan for the two key premium features.

---

## Feature 1: Expert Knowledge Advisors

### Description
Advisors with custom knowledge bases that can reference specific documents, frameworks, and domain expertise.

### Value Proposition
- **Generic advisors** can only draw on LLM training data
- **Expert knowledge advisors** can reference your specific documents, frameworks, and context
- Saves hours of research and context-loading
- Provides actual expertise vs. generic advice

### Implementation Phases

#### Phase 1: Text-Based Knowledge (MVP)
**Timeline**: 2-3 weeks

**Features**:
- Text field (2000 characters) for adding knowledge to advisors
- Knowledge is included in advisor's system prompt
- Simple but effective for v1

**Database Schema**:
```sql
ALTER TABLE advisors ADD COLUMN expert_knowledge TEXT;
ALTER TABLE advisors ADD COLUMN has_expert_knowledge BOOLEAN DEFAULT false;
```

**UI Changes**:
- Add "Expert Knowledge" section to advisor creation/edit form
- Show indicator for advisors with expert knowledge
- Premium-only feature (check subscription tier)

**API Changes**:
- Include expert_knowledge in system prompt when present
- Validate expert_knowledge length (max 2000 chars)
- Check subscription tier before allowing expert knowledge

**Files to Create/Modify**:
- `src/components/AdvisorForm.jsx` - Add expert knowledge field
- `src/components/EditAdvisorForm.jsx` - Add expert knowledge field
- `src/hooks/useClaude.js` - Include expert knowledge in system prompt
- `functions/api/chat/claude.js` - Validate premium tier for expert knowledge

---

#### Phase 2: File Upload (v2)
**Timeline**: 3-4 weeks after Phase 1

**Features**:
- Upload PDF, TXT, MD files
- Extract text from files
- Store in Supabase Storage
- Reference in advisor prompts

**Database Schema**:
```sql
CREATE TABLE advisor_knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Storage**:
- Use Supabase Storage for file storage
- Bucket: `advisor-knowledge-files`
- RLS policies: Users can only access their own files

**Text Extraction**:
- For PDFs: Use pdf-parse or similar library
- For TXT/MD: Direct text extraction
- Store extracted text for quick access

**UI Changes**:
- File upload component in advisor form
- Display uploaded files
- Delete files option
- Show file size and type

**API Changes**:
- File upload endpoint
- Text extraction service
- Include extracted text in advisor prompts

---

#### Phase 3: RAG (Retrieval-Augmented Generation) (v3)
**Timeline**: 6-8 weeks after Phase 2

**Features**:
- Vector embeddings for knowledge files
- Semantic search across knowledge base
- Retrieve relevant chunks for each query
- More efficient than including all text

**Implementation**:
- Use Supabase Vector extension or OpenAI embeddings
- Store embeddings in database
- Retrieve top-k relevant chunks for each query
- Include in advisor context

**Database Schema**:
```sql
CREATE TABLE advisor_knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID REFERENCES advisors(id) ON DELETE CASCADE,
  file_id UUID REFERENCES advisor_knowledge_files(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_embeddings_advisor ON advisor_knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);
```

**API Changes**:
- Embedding generation endpoint
- Vector search endpoint
- Include retrieved chunks in advisor prompts

---

### Premium Feature Check

**Implementation**:
```javascript
// In advisor creation/editing
function canUseExpertKnowledge(userTier) {
  return userTier === 'premium' || userTier === 'coaching';
}

// In API endpoint
if (expertKnowledge && userTier === 'free') {
  return new Response(
    JSON.stringify({ error: 'Expert knowledge is a premium feature' }),
    { status: 403 }
  );
}
```

---

## Feature 2: Advanced Analytics

### Description
User-facing analytics dashboard showing conversation quality metrics, insight frequency, perspective diversity, and personal development over time.

### Value Proposition
- See yourself getting better at thinking
- Identify blind spots in your thinking
- Optimize advisor panels based on data
- Track cognitive development over time

### Metrics to Track

#### 1. Insight Frequency
- How often you have breakthrough moments
- Language markers: "I hadn't thought of that", "Oh, I see now", "That's a new perspective"
- NLP analysis of conversation content

#### 2. Perspective Diversity
- How well your advisor panels challenge each other
- Measure disagreement/disagreement between advisors
- Track diversity score over time

#### 3. Conversation Depth
- Average conversation length
- Question quality (complexity, depth)
- Integration of multiple perspectives

#### 4. Advisor Effectiveness
- Which advisors generate most valuable responses
- User engagement with each advisor (clicks, reads, uses insights)
- Advisor performance metrics

#### 5. Sophistication Score
- Composite metric combining:
  - Insight frequency
  - Perspective diversity
  - Conversation depth
  - Advisor effectiveness
- Trajectory over time

#### 6. Longitudinal Trends
- How thinking patterns evolve over months
- Progress visualization
- Comparison to past self

### Implementation Phases

#### Phase 1: Basic Analytics (MVP)
**Timeline**: 3-4 weeks

**Features**:
- Conversation count and total messages
- Average conversation length
- Most used advisors
- Basic charts (line, bar)

**Database Schema**:
```sql
CREATE TABLE conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_count INTEGER,
  advisor_count INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE advisor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  advisor_id TEXT NOT NULL, -- Advisor name/ID
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**UI Components**:
- Analytics dashboard page
- Basic charts using Chart.js or similar
- Time range selector (7 days, 30 days, 90 days, all time)

**API Endpoints**:
- `GET /api/analytics/overview` - Basic stats
- `GET /api/analytics/conversations` - Conversation metrics
- `GET /api/analytics/advisors` - Advisor usage

**Files to Create**:
- `src/components/AnalyticsDashboard.jsx`
- `src/hooks/useAnalytics.js`
- `functions/api/analytics/overview.js`
- `functions/api/analytics/conversations.js`
- `functions/api/analytics/advisors.js`

---

#### Phase 2: Insight Detection (v2)
**Timeline**: 4-5 weeks after Phase 1

**Features**:
- NLP analysis to detect insights
- Insight markers in conversations
- Insight frequency tracking
- Insight timeline

**Implementation**:
- Use OpenAI API for text analysis
- Detect insight language patterns
- Store insights in database
- Display in analytics dashboard

**Database Schema**:
```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  insight_text TEXT,
  confidence_score FLOAT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**NLP Analysis**:
- Use GPT-4o-mini for cost-effective analysis
- Prompt: "Identify if this message contains an insight or breakthrough moment"
- Store results for analytics

**UI Changes**:
- Insight markers in conversations
- Insight frequency chart
- Insight timeline view

---

#### Phase 3: Advanced Metrics (v3)
**Timeline**: 6-8 weeks after Phase 2

**Features**:
- Perspective diversity scoring
- Sophistication score calculation
- Longitudinal trend analysis
- Comparison views

**Implementation**:
- Calculate diversity scores from advisor responses
- Composite sophistication metric
- Time-series analysis
- Progress visualization

**Database Schema**:
```sql
CREATE TABLE user_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  insight_count INTEGER DEFAULT 0,
  perspective_diversity_score FLOAT,
  conversation_depth_score FLOAT,
  sophistication_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**Calculations**:
- Perspective diversity: Measure disagreement between advisors
- Conversation depth: Average message length, question complexity
- Sophistication: Weighted combination of all metrics

**UI Changes**:
- Sophistication score display
- Progress charts over time
- Comparison to past periods
- Goal setting and tracking

---

### Premium Feature Check

**Implementation**:
```javascript
// In analytics API endpoints
function canAccessAnalytics(userTier) {
  return userTier === 'premium' || userTier === 'coaching';
}

// In frontend
if (userTier === 'free') {
  return <UpgradePrompt />;
}
```

---

## Implementation Priority

### Immediate (Weeks 1-4)
1. ✅ Expert Knowledge Advisors - Phase 1 (Text-based)
2. ✅ Advanced Analytics - Phase 1 (Basic analytics)

### Short-term (Weeks 5-12)
3. Expert Knowledge Advisors - Phase 2 (File upload)
4. Advanced Analytics - Phase 2 (Insight detection)

### Medium-term (Weeks 13-20)
5. Expert Knowledge Advisors - Phase 3 (RAG)
6. Advanced Analytics - Phase 3 (Advanced metrics)

---

## Testing Strategy

### Expert Knowledge Advisors
- Test with various knowledge types (legal, medical, technical)
- Verify knowledge is included in prompts
- Test premium feature gating
- Performance testing with large knowledge bases

### Advanced Analytics
- Test analytics accuracy
- Verify calculations are correct
- Test with various conversation patterns
- Performance testing with large datasets

---

## Success Metrics

### Expert Knowledge Advisors
- % of premium users using expert knowledge
- Average knowledge base size
- User satisfaction with expert advisors
- Conversion impact (free → premium)

### Advanced Analytics
- % of premium users viewing analytics
- Frequency of analytics views
- User engagement with insights
- Self-reported value of analytics

---

*This implementation plan should be updated as features are built and feedback is received.*

