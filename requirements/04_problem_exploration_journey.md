# Problem Exploration Journey

## User Flow Summary

The flow consists of five sub-journeys:

1. **First Input** - Users start conversations with system prompts or their own questions
2. **Seed Prompt Selection** - Users can choose from categorized templates to frame their exploration
3. **Context Setting** - Users provide background information for meaningful advisor responses
4. **Perspective Exploration** - Multi-turn dialogue where advisors offer distinct viewpoints and challenge assumptions
5. **Conversation Closure** (Optional, Non-MVP) - Users consolidate insights and transition to practical application

## Goals

- Make clear the user's options in terms of starting the conversation (see 2.1 below for sub-journeys)
- Guide users from a state of cognitive constriction to expanded awareness and clarity
- Illuminate blind spots and unexamined assumptions
- Generate novel insights and possibilities that the user wouldn't reach on their own

## Non-goals

- Pushing users toward a single "correct" solution
- Merely making users feel better without genuine insight or "felt shifts" (in the sense meant by Eugene Gendlin in *Focusing*)
- Replacing professional therapy or advice in crisis situations

## User State at Start

The user feels stuck, overwhelmed, or caught between limited options. They experience physical tension, emotional discomfort, or mental looping around the same ideas. They may be frustrated by their inability to see a way forward.

User has their advisors selected and is looking at the conversation screen. They may feel uncertain how to begin or what to type.

## User State at End

The user feels a sense of spaciousness, clarity, and possibility. Their breathing is relaxed, their thinking is fluid, and they can see multiple promising paths forward. They have experienced an "insight cascade" where new connections and ideas began to flow naturally. They feel that this conversation has taken them somewhere "deep," that they would not have been able to get to without guidance and augmented perspective.

## Conversation Flow Constraints

- Health nudge: System gently suggests stepping away after extended sessions (maybe after 60-90 minutes of active use)
- Each advisor should maintain a consistent voice and perspective aligned with their description
- By default, all active advisors respond to each user message
- The system only excludes an advisor if the user's message is clearly directed at a specific advisor (e.g., "Snow Leopard, what do you think about...")
- Users have full control via the left sidebar to activate/deactivate advisors at any time
- Advisors should challenge the user's assumptions when that is what makes sense from their perspective
- Advisors should surface their own background only where directly relevant and useful (i.e. we want to avoid the "encyclopedia effect" that happens with real named people, where it seems like the LLM is trying to demonstrate its knowledge of the person rather than roleplaying them)
- Conversation should progress toward greater clarity rather than circular discussion
- (Non-MVP) System should detect when a perspective has been exhausted and suggest bringing in different advisors or changing current ones (see 1.4 above). 

## Quality Metrics for Problem Exploration

- Sentiment shift in user responses (from negative/constrained to positive/expansive)
- Presence of "insight markers" in user language ("I hadn't thought of that," "That's a new perspective," etc.)
- Conversation length, both in terms of turns taken and in terms of how often the user returns to the same conversation more than 2 hours since the last engagement

## 2.1 Problem Exploration Sub-Journeys

### 2.1.1 First Input Journey

#### Goals

- Lower the barrier to entry for users who may feel uncertain about how to begin
- Provide natural conversation starter that invites reflection
- Set the tone for a thoughtful, exploratory conversation
- Gently guide users toward articulating their situation in a way that advisors can meaningfully respond to

#### User State at Start

The user has selected their advisors and is looking at an empty conversation screen. They may feel a mixture of curiosity, uncertainty, and possibly mild anxiety about how to articulate their situation effectively. They might be hesitant about what level of detail to provide or how to frame their question.

#### User State at End

The user has successfully started the conversation with a prompt that feels authentic to them and adequately captures the essence of what they want to explore. They feel a sense of commitment to the process and anticipation about the perspectives that will emerge.

#### Process Constraints

- System should offer a simple, open-ended starter question (e.g., "What's on your mind today?")
- The interface should make it visually clear that the user can either respond to this question or type their own prompt
- The system should provide a visible option to access saved prompt templates
- First-time users should receive a brief tooltip explaining that more detailed initial prompts often lead to more helpful advisor responses

#### Quality Metrics

- Length and detail level of initial user prompts
- Proportion of conversations where users use system-suggested starters vs. writing their own
- Abandonment rate at the first input stage

### 2.1.2 Seed Prompt Selection Journey

#### Goals

- Provide users with well-crafted templates that model effective prompts
- Help users who know their topic but struggle with how to frame it effectively
- Expose users to different categories of exploration (decision-making, creative thinking, etc.)
- Reduce cognitive load for return users exploring familiar territory

#### User State at Start

The user has a general sense of what they want to explore but may benefit from structure or inspiration for how to articulate their prompt. They may be considering whether to use a template or create their own prompt from scratch.

It is also possible that the user is returning to a conversation that is already of some length. However, they are returning after some period of time and looking to initiate a new round of conversation within the whole, which may or may not explore the same themes as similar rounds.

#### User State at End

The user has selected and possibly customized a seed prompt that feels relevant to their situation. They feel confident that this prompt will help guide the conversation in a productive direction and set the right context for advisor responses.

#### Process Constraints

- Seed prompts should be organized in easily scannable categories
- Each prompt should have clear placeholder text to guide customization
- Selection interface should be non-disruptive to the conversation flow
- (Non-MVP) System should track which prompts the user has used previously and highlight them
- Templates should be diverse in both topic and structure

#### Quality Metrics

- Usage rate of different seed prompt categories & default templates
- Customization rate (how often users modify templates before sending)
- Correlation between seed prompt usage and conversation depth/length

### 2.1.3 Context Setting Journey

#### Goals

- Help users provide rich background information that advisors can reference
- Encourage users to articulate multiple dimensions of their situation
- Set appropriate expectations for the depth and type of advisor responses
- Create a foundation for ongoing conversation that maintains coherence

#### User State at Start

The user has initiated a round of conversation (either with their own prompt or a template) and is in the process of providing context. They may be uncertain about how much detail to include or which aspects of their situation are most relevant.

NOTE: A round of conversation is defined here as a conversation that a) begins more than 1 hour after the previous message, based on timestamps, or b) has been marked as a completed round (see Closure journey below).

#### User State at End

The user feels they have successfully communicated the essential context of their situation. They believe the advisors have sufficient information to provide meaningful perspectives, and they feel ready to engage with the responses that emerge.

(In practice, the line between context setting and perspective exploration will be nebulous, but it seems useful to get a sense of it as a distinct step.)

#### Process Constraints

- System should recognize when a new round of conversation has begun, acknowledge the time difference, and not assume that the situation is the same as before the break
- System should provide gentle guidance about helpful context elements (without being prescriptive)
- If the user's initial prompt is very brief, advisors should ask clarifying questions
- System should maintain a "context summary" that can be referenced by both the user and advisors
- Context setting should feel conversational rather than like filling out a form

#### Quality Metrics

- Completeness of situational context (will need to devise a multi-criteria measure for this)
- Amount of turns taken to achieve baseline situational context

### 2.1.4 Perspective Exploration Journey

#### Goals

- Facilitate deep, multi-perspective examination of the user's situation
- Regularly make visible the user's current understanding and metaphorical frames
- Suggest alternative frames and approaches that emerge naturally from each advisors' perspective
- Maintain a balanced dialogue where advisors apply their distinct perspectives (without drifting into a homogenous mush)
- Help the user identify patterns, assumptions, and blind spots in their thinking

#### User State at Start

The user has provided context and begun engaging with initial advisor responses. They may feel a mix of curiosity, hopefulness, and some uncertainty about whether this process will lead to meaningful insights. They are open to exploration but may be somewhat attached to their existing framing of the situation, or perhaps unaware of it.

#### User State at End

The user has experienced a series of perspective shifts and "aha moments." They can see their situation from multiple angles and have a more nuanced understanding of the dynamics involved. Their thinking has become more flexible, and they feel less stuck in rigid patterns. The conversation has moved from surface-level considerations to deeper values, patterns, or insights. The user feels ready to begin consolidating their insights before closing out the session.

#### Process Constraints

- Each advisor should maintain a distinct perspective while building on what has been shared
- System should ensure balanced participation across advisors
- System should modulate between challenging and supporting the user, using sentiment analysis to judge what's appropriate
- Conversation should naturally move toward greater depth and integrity rather than circling on the same points (i.e. should detect loops and point them out)
- Advisors should disagree with each other when that is what their perspectives lead to
- System should avoid sycophancy—confirming or validating the user's narratives and frames by default or without providing clear and concrete reasoning and evidence
- When the user attempts to out-source important questions or decisions (to get the system to decide something for them), the system should decline to make such decisions and respond with further curiosity, seeking to increase its own context awareness and the user's

#### Quality Metrics

- Length of conversation (in turns and in overall length of user inputs)
- Depth ratings for conversational turns (tracking movement from surface-level discussion to deeper insights)
- Diversity of perspectives per turn (averaged across the conversation)
- User engagement depth (average length of user responses)
- Frequency of insight markers in user language
- Emotional tone shift between user messages (e.g., from frustrated to curious, or from anxious to contemplative)
- Occurrence of cross-advisor synthesis (advisors building on each other's perspectives)
- Occurrence of cross-advisor disagreement
- Sycophancy rating of advisor outputs (if they confirmed the user's view, did they provide compelling evidence for it?)
- Occurrence of advisors refusing to make decisions for the user

### 2.1.5 Conversation Closure Journey (Optional) (Non-MVP)

#### Goals

- Help users recognize when they've reached a natural point of completion for this phase of the conversation
- Prevent unhealthy patterns of overuse
- Consolidate key insights and perspective shifts that emerged during the conversation
- Create a sense of meaningful resolution while acknowledging the possibility of continuation in the same conversation thread later
- Facilitate practical integration of insights into the user's life beyond the conversation
- Support the user in determining potential next steps

#### Non-Goals

- The user should not be forced to close the conversation, nor should it be communicated that closing the conversation is the right or canonical way to proceed

#### User State at Start

The user has experienced meaningful exploration and multiple perspective shifts. They sense that they've reached a natural plateau in the conversation and are ready to integrate what they've learned. They may feel intellectually stimulated, emotionally satisfied, or simply fatigued from deep engagement.

#### User State at End

The user feels a sense of completion and integration. They can articulate key insights from the conversation and have a clearer sense of how to apply these insights moving forward. They feel the conversation has been valuable and worth the time invested. They may have identified specific actions to take or areas for further exploration in future conversations. They are ready to leave the app.

#### Process Constraints

- Optional closure: User-triggered via button or command (like "/wrap-up" or "/summarize")
- Advisors should first prompt the user to summarize key insights from the conversation, helping them only secondarily or if requested
- Closure should feel like a natural culmination rather than an abrupt ending
- System should provide options for saving insights
- Advisors should acknowledge both intellectual insights and emotional/energetic shifts
- Closure process should help transition from exploratory thinking to practical application
- System should provide an actual closing ritual of some kind that invites the user to move out of the conversation interface
- System should mark the end of the conversational round for later reference

#### Quality Metrics

- Quality of user-generated summaries (comprehensiveness and insight integration)
- Satisfaction ratings of user closure language
- Follow-up conversation rate (users returning to same conversation thread to continue exploration)
- Save/export rate of conversation insights
- Frequency of users explicitly acknowledging value received from the conversation
- Usage rate of optional closure features 