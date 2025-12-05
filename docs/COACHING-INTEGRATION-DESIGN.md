# Coaching Integration Design

*Design document for Model 5: Coaching-Integrated Hybrid Model*

---

## Overview

This document outlines how SPACE Terminal can be integrated with personal coaching practice, creating mutual value for both SPACE and coaching clients.

---

## Value Proposition

### For Coaching Clients
- **SPACE as Coaching Tool**: Use SPACE between sessions to explore perspectives, work through challenges, and prepare for coaching conversations
- **Coaching-Specific Advisors**: Advisors designed for coaching methodologies (IFS, ACT, CBT, etc.)
- **Session Preparation**: Use SPACE to clarify thoughts before coaching sessions
- **Between-Session Work**: Continue growth work between coaching sessions
- **Documentation**: Track progress and insights over time

### For Coaches
- **Enhanced Coaching Tool**: SPACE becomes part of coaching toolkit
- **Client Engagement**: Clients stay engaged between sessions
- **Perspective Exploration**: Help clients explore multiple perspectives on challenges
- **Differentiation**: Unique offering that competitors don't have
- **Scalability**: Can work with more clients effectively

### For SPACE
- **Premium Revenue**: Coaching packages include premium SPACE
- **Use Case Validation**: Real-world validation of SPACE's value
- **Word of Mouth**: Coaches recommend SPACE to other coaches
- **Feature Development**: Coaching use cases drive feature development

---

## Coaching-Specific Features

### 1. Coaching Advisor Library

**Pre-built Advisors for Common Coaching Methodologies**:

#### Internal Family Systems (IFS)
- **Parts Work Advisor**: Helps identify and dialogue with internal parts
- **Self-Energy Advisor**: Embodies the Self (compassionate, curious, calm)
- **Protector Advisor**: Helps understand protective parts
- **Exile Advisor**: Helps understand vulnerable parts

#### Acceptance and Commitment Therapy (ACT)
- **Values Clarification Advisor**: Helps identify core values
- **Cognitive Defusion Advisor**: Helps separate from thoughts
- **Present Moment Advisor**: Helps with mindfulness and presence
- **Committed Action Advisor**: Helps with value-based action

#### Cognitive Behavioral Therapy (CBT)
- **Thought Challenging Advisor**: Helps identify cognitive distortions
- **Behavioral Activation Advisor**: Helps with action planning
- **Emotion Regulation Advisor**: Helps understand and manage emotions

#### Narrative Therapy
- **Story Deconstruction Advisor**: Helps examine life stories
- **Alternative Narrative Advisor**: Helps create new stories
- **Externalization Advisor**: Helps separate person from problem

#### Somatic/Embodied Approaches
- **Body Awareness Advisor**: Helps with somatic awareness
- **Nervous System Advisor**: Helps understand nervous system states
- **Movement Advisor**: Helps with embodied practices

#### Existential/Philosophical
- **Meaning-Making Advisor**: Helps explore questions of meaning
- **Death Awareness Advisor**: Helps with mortality awareness (Memento Mori)
- **Freedom Advisor**: Helps explore questions of freedom and responsibility

**Custom Coaching Advisors**:
- Coaches can create custom advisors based on their specific methodology
- Share advisors with clients or keep private
- Build advisor library over time

---

### 2. Coaching Session Integration

#### Pre-Session Preparation
- **Session Prep Mode**: SPACE helps clients prepare for coaching sessions
  - "What do I want to explore today?"
  - "What's been coming up since last session?"
  - "What perspectives do I want to bring?"
- **Insight Capture**: Clients capture insights from SPACE conversations
- **Question Generation**: SPACE generates questions to explore in session

#### During Session
- **Live SPACE Use**: Coach and client use SPACE together during session
  - Explore perspectives on current challenge
  - Generate alternative viewpoints
  - Test assumptions
- **Co-Facilitated Conversations**: Coach guides client through SPACE conversation

#### Post-Session Integration
- **Session Notes**: Coach can add session notes to SPACE conversations
- **Action Items**: Track action items from sessions
- **Between-Session Work**: Assign SPACE exercises between sessions

---

### 3. Coaching Client Dashboard

**For Clients**:
- **Progress Tracking**: See progress over time
- **Insight History**: Review past insights and breakthroughs
- **Session Preparation**: Tools for preparing for sessions
- **Between-Session Work**: Assigned exercises and reflections

**For Coaches**:
- **Client Overview**: See all clients' SPACE activity
- **Progress Monitoring**: Track client progress between sessions
- **Session Planning**: Use SPACE insights to plan sessions
- **Client Engagement**: See which clients are using SPACE actively

---

### 4. Coaching-Specific Analytics

**For Clients**:
- **Insight Frequency**: How often are you having breakthroughs?
- **Perspective Diversity**: Are you exploring diverse perspectives?
- **Pattern Recognition**: What patterns emerge in your thinking?
- **Progress Metrics**: How is your thinking evolving over time?

**For Coaches**:
- **Client Engagement**: Which clients are using SPACE?
- **Progress Indicators**: What progress are clients making?
- **Session Preparation**: Are clients preparing for sessions?
- **Outcome Tracking**: Correlate SPACE usage with coaching outcomes

---

### 5. Coaching Community Features

**Shared Resources**:
- **Advisor Library**: Coaches share advisor configurations
- **Methodology Templates**: Pre-built advisor sets for different approaches
- **Case Studies**: Examples of SPACE use in coaching
- **Best Practices**: How to integrate SPACE into coaching practice

**Coaching Tools Marketplace**:
- Coaches can sell specialized advisor packs ($50-$200)
- Other coaches can purchase and use
- Creates revenue stream for coaches and SPACE

---

## Pricing Models

### Model A: Coaching Package (Recommended)

**Structure**:
- **Coaching + Premium SPACE**: $300-$500/month
  - Includes: 4-8 coaching sessions/month
  - Includes: Premium SPACE access
  - Includes: Coaching-specific advisors
  - Includes: Coaching dashboard
- **Standalone Premium SPACE**: $15-20/month (for non-coaching users)

**Value Proposition**:
- Clients get coaching + powerful thinking tool
- Coaches can charge premium (tool adds value)
- SPACE gets premium revenue

**Example**:
- Coach charges $300/month for coaching + SPACE
- SPACE portion: $20/month (included)
- Coach portion: $280/month
- Coach can position as "coaching + AI thinking tool"

---

### Model B: SPACE as Add-On

**Structure**:
- **Coaching Only**: $200-$400/month (existing coaching rate)
- **SPACE Add-On**: +$20/month (optional)
- **Coaching + SPACE Bundle**: $250-$450/month (discounted)

**Value Proposition**:
- Flexible - clients can choose
- Lower barrier to entry
- Upsell opportunity

---

### Model C: SPACE-First, Coaching Optional

**Structure**:
- **Premium SPACE**: $15-20/month (base)
- **Coaching Sessions**: $100-$150/session (a la carte)
- **Coaching Package**: $300/month (4 sessions + premium SPACE)

**Value Proposition**:
- Low barrier to entry (just SPACE)
- Upsell to coaching
- Flexible pricing

---

## Technical Implementation

### Database Schema Additions

```sql
-- Coaching relationships
CREATE TABLE public.coaching_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Coaching sessions
CREATE TABLE public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id UUID REFERENCES public.coaching_relationships(id),
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  action_items JSONB DEFAULT '[]',
  linked_conversations UUID[] DEFAULT '[]', -- SPACE conversations linked to session
  metadata JSONB DEFAULT '{}'
);

-- Coaching advisors (shared advisor library)
CREATE TABLE public.coaching_advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  methodology TEXT, -- IFS, ACT, CBT, etc.
  system_prompt TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  price_cents INTEGER, -- If selling advisor pack
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Feature Implementation Priority

#### Phase 1: MVP (Weeks 1-4)
- [ ] Coaching advisor library (pre-built advisors)
- [ ] Basic coaching dashboard (client view)
- [ ] Link SPACE conversations to coaching sessions
- [ ] Coaching package pricing integration

#### Phase 2: Enhanced (Weeks 5-8)
- [ ] Coach dashboard (multi-client view)
- [ ] Session preparation tools
- [ ] Between-session work assignments
- [ ] Coaching-specific analytics

#### Phase 3: Community (Weeks 9-12)
- [ ] Shared advisor library
- [ ] Advisor marketplace
- [ ] Coaching community features
- [ ] Best practices documentation

---

## Marketing Strategy

### For Coaches
- **Value Prop**: "Enhance your coaching practice with AI-powered perspective exploration"
- **Channels**: Coaching communities, LinkedIn, coaching conferences
- **Messaging**: 
  - "Help clients explore multiple perspectives between sessions"
  - "Differentiate your practice with cutting-edge tools"
  - "Increase client engagement and outcomes"

### For Coaching Clients
- **Value Prop**: "Get coaching + powerful thinking tool"
- **Channels**: Through coaches, direct marketing
- **Messaging**:
  - "Continue your growth work between sessions"
  - "Explore perspectives on your challenges"
  - "Prepare for coaching sessions with clarity"

---

## Success Metrics

### For SPACE
- **Coaching Packages Sold**: Target 10-20 packages in first 6 months
- **Revenue**: $3K-$6K/month from coaching packages
- **Coach Adoption**: 5-10 coaches using SPACE in first year
- **Client Retention**: Higher retention for coaching package clients

### For Coaches
- **Client Engagement**: Increased engagement between sessions
- **Outcomes**: Better coaching outcomes (subjective)
- **Differentiation**: Unique offering vs. competitors
- **Revenue**: Ability to charge premium for coaching + tool

---

## Risks & Mitigations

### Risk 1: Coaches Don't Adopt
**Mitigation**: 
- Make it easy to use (minimal setup)
- Provide training and support
- Show clear value (case studies)

### Risk 2: Clients Don't Use SPACE
**Mitigation**:
- Make SPACE part of coaching process (not optional)
- Provide clear value (session prep, between-session work)
- Coach accountability (check in on SPACE usage)

### Risk 3: Confusion About Positioning
**Mitigation**:
- Clear messaging (coaching + tool, not replacement)
- Training for coaches on how to integrate
- Documentation and best practices

---

## Next Steps

### Immediate (This Month)
1. **Survey Existing Coaching Clients**
   - Do they see value in SPACE?
   - Would they pay for coaching + SPACE package?
   - What features would be most valuable?

2. **Design MVP Features**
   - Coaching advisor library
   - Basic coaching dashboard
   - Pricing integration

3. **Build MVP** (if validated)
   - Implement Phase 1 features
   - Test with 2-3 coaching clients
   - Iterate based on feedback

---

*This design should be validated with coaching clients and iterated based on feedback.*

