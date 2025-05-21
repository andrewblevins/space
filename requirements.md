# SPACE - PRODUCT REQUIREMENTS DOC 

## Purpose of This Document

This document outlines the product requirements for SPACE Terminal. It is specifically geared toward providing the level of specificity needed to begin writing useful evals for the product, but could also be used as a general guide to creating v0 of the product. 

A few aspirational features are also described, marked “(non-MVP)” where they appear.

## Core User Problem & Solution

Users come to SPACE when experiencing cognitive or emotional constriction - they feel stuck between limited options, overwhelmed by complexity, unable to integrate conflicting perspectives on a situation.

The key user need is to expand their mental space beyond what a single perspective (their own or a standard AI assistant's) can provide.

SPACE solves this by facilitating conversations with multiple AI advisors that:

1. Offer a set of well-balanced and genuinely distinct perspectives
2. Hold the relevant details of the situation in memory
3. Illuminate possibilities or patterns the user would not have considered on their own

## Non-goals

- SPACE is not designed to be addictive, in fact we want to take measures to prevent compulsive use of the app and steer the user toward leaving it when they achieve completion on their problem.
- SPACE is not really for finding information, in the traditional sense. It won't search the internet, for instance, find primary sources, or perform deep research. It is a relatively closed container.
- SPACE is not for people who are looking to have the process of selecting and prompting their advisors happen completely behind the scenes. It invites the user to take responsibility for the entities they are talking to.
- SPACE is not designed to deal with clinical levels of confusion and overwhelm. For people incapable of differentiating virtual entities from real ones, it could be actively dangerous.
- SPACE is not designed to work with image or video generation.

## Overall User Workflow

1. User creates an account or logs in with their credentials.
2. If it's their first time, they can go through an optional "worksheet" dialogue to receive recommended advisors based on their background and preferences.
3. Alternatively, the user can create custom advisors by clicking the + button and either:
    - Writing their own advisor description
    - Using AI assistance to generate a description from minimal input
4. The user starts a conversation by either:
    - Responding to the system's open-ended starter question
    - Writing their own custom prompt
    - Selecting a template from the seed prompt library
5. Advisors respond from their distinct perspectives, asking clarifying questions if needed.
6. The user engages in multi-perspective exploration with the advisors, with the system maintaining balanced participation from all advisors.
7. When the conversation reaches a natural endpoint, the system helps the user consolidate insights.
8. The user summarizes key takeaways and can save these insights for future reference.
9. The user can return to continue the same conversation thread later or start a new one with the same or different advisors.

## Critical User Journeys

SPACE involves two primary user journeys: Advisor Creation and Exploration. 

### 1. Advisor Creation Journey

#### Goals

- Enable users to generate AI advisors within minutes
- Help the user create advisors that are sufficiently differentiated in their approaches, values, and thinking styles
- Create a balanced panel of advisors that can illuminate different aspects of a problem

#### Non-goals

- Creating advisors that give harmful, unethical, or dangerous advice
- Creating advisors that are merely slight variations of each other (this is okay if the user wants it, but the system should consistently nudge against it)

#### User State at Start

The user feels curious but potentially uncertain about what perspectives would be most helpful for their situation. They may have some ideas about what kinds of advisors they want but need guidance on articulating specific perspectives.

#### User State at End

The user feels confident that they have assembled a diverse panel of advisors that will provide meaningfully different angles on their situation. They understand the perspective each advisor brings and feel a sense of positive anticipation about engaging with them.

#### Constraints on Advisor Creation

- Each advisor must have a clearly defined perspective, background, or thinking style
- Each advisor description should be more than 100 words to ensure sufficient detail
- System should nudge the user to revise advisor descriptions that are too vague or too similar to currently active advisors

#### Quality Metrics for Advisor Creation

- Frequency with which user accepts generated advisors without revision
- Number of completed rounds with generated advisors

#### Advisor Creation Sub-Journeys

The Advisor Creation journey can be broken down into three distinct sub-journeys:

##### 1.1. Worksheet-Based Advisor Generation Sub-Journey

###### Goals

- Help users who aren't sure what perspectives they need
- Get rich context about the user's background, values, interests, and thinking style
- Generate a balanced initial set of advisors tailored to complement the user's perspective

###### User State at Start

The user is facing a “cold start” problem. They may be uncertain what kinds of advisors would be most helpful, or want to generate options so that they can evaluate them and discover better what kinds of advisors they would like. They may also be curious to see if the worksheet process might reveal something new about themselves or suggest figures or traditions that would be useful for them. They prefer a guided approach rather than creating advisors from scratch.

###### User State at End

The user is looking at a fresh conversation. In the advisor panel, they have a set of 3-5 advisors that each provide distinct perspectives and together provide a balance of perspectives. They feel that the advisors are well-chosen. They have a sense of positive anticipation and are eager to see what interacting with these advisors will be like. The advisors are by default activated, i.e. will be injected into the next prompt.

###### Process Constraints

- Worksheet should take no more than 10 minutes to complete
- Suggested advisors should be different from the others along at least 3 substantial axes (e.g. methodology, values, field of expertise)
- Questions should build contextual understanding and use a range of question types to get a complex view of the person and their goals (for now we can just use the worksheets already in Insight Cascade)
- Final advisor suggestions should explicitly reference aspects of the user's input
- System should explain why each advisor was selected for the user
- User should have an opportunity to reject specific advisors and ask for new suggestions before the advisors are added to the advisors panel

###### Quality Metrics

- Completion rate of worksheet
- Number of questions answered on worksheet
- User acceptance rate of suggested advisors
- Number of turns taken with suggested advisors
- Length of advisor selection conversation

##### 1.2. Manual Advisor Creation Sub-Journey

###### Goals

- Provide a simple, fast interface for creating custom advisors
- Ensure created advisors are well-defined and usable
- Support users who have specific perspectives they want to explore

###### Non-Goals

- The user should not be nudged to use any of the generative features.

###### User State at Start

The user has specific perspectives or advisor types in mind and wants to quickly add them to their panel.

###### User State at End

The user has successfully created a set of advisors that accurately represent the perspectives they wanted to include. The user feels that the perspectives are each richly defined, and has a general sense of the flavor of interaction that each advisor will afford.

###### Process Constraints

- Creation process should take less than 2 minutes
- Provide a default template for advisor descriptions

###### Quality Metrics

- Time to complete advisor creation
- Revision rate (how often users modify a generated description)
- Success rate of first-attempt descriptions

##### 1.3. AI-Assisted Advisor Generation Sub-Journey

###### Goals

- Help users who have a general idea but struggle with articulation
- Translate vague concepts into well-formed advisor descriptions
- Generate diverse, high-quality advisors from minimal input

###### User State at Start

The user has a general concept of the type of perspective they want but needs help articulating it fully.

###### User State at End

The user has a well-articulated advisor that captures the essence of what they were seeking, with details that enhance its usefulness.

###### Process Constraints

- System should generate descriptions based on as little as a title or one-sentence description
- Generated descriptions should be editable by the user
- Generation should take less than 10 seconds

###### Quality Metrics

- (RETURN TO THIS ONE)
- Edit distance between generated and final descriptions
- Acceptance rate of generated descriptions

#### 1.4. Advisor Evolution Sub-Journey (Aspirational, Post-MVP)

###### Goals

- Allow advisors to evolve or transform their perspectives based on conversation context
- Enable users to request modifications to advisor perspectives mid-conversation
- Create a sense of organic growth and adaptability in the advisory system

###### User State at Start

The user feels unsatisfied with one or more advisor, or feels that their perspective is no longer congruent for the situation. For instance, they may have been talking to three advisors for a long time, and feel that one of them is a “weak link” and not functioning as well as the others.  

###### User State at End

The user feels a sense of creative agency and collaboration as they shape the advisory system to better suit their evolving needs. They experience the satisfaction of having advisors that can grow alongside their thinking.

###### Process Constraints

- Evolution should maintain an aspect of the advisor’s identity while allowing meaningful shifts
- System should prevent harmful or manipulative transformations
- Changes should be traceable (user can see original vs. current perspective)
- Evolved advisors can be saved as new versions or variants for easy rollback

###### Quality Metrics

- Acceptance rate of evolved advisors (i.e. how often the user replaces the previous advisor with the new version)
- Retention of distinctiveness of perspective after evolution
- Proportion of evolved advisors that get reused in future sessions

### 2. Problem Exploration Journey

#### Goals

- Make clear the user’s options in terms of starting the conversation (see 2.1 below for sub-journeys)
- Guide users from a state of cognitive constriction to expanded awareness and clarity
- Illuminate blind spots and unexamined assumptions
- Generate novel insights and possibilities that the user wouldn't reach on their own

#### Non-goals

- Pushing users toward a single "correct" solution
- Merely making users feel better without genuine insight or “felt shifts” (in the sense meant by Eugene Gendlin in *Focusing*)
- Replacing professional therapy or advice in crisis situations

#### User State at Start

The user feels stuck, overwhelmed, or caught between limited options. They experience physical tension, emotional discomfort, or mental looping around the same ideas. They may be frustrated by their inability to see a way forward.

User has their advisors selected and is looking at the conversation screen. They may feel uncertain how to begin or what to type.

#### User State at End

The user feels a sense of spaciousness, clarity, and possibility. Their breathing is relaxed, their thinking is fluid, and they can see multiple promising paths forward. They have experienced an "insight cascade" where new connections and ideas began to flow naturally. They feel that this conversation has taken them somewhere “deep,” that they would not have been able to get to without guidance and augmented perspective.

#### Conversation Flow Constraints

- Each advisor should maintain a consistent voice and perspective aligned with their description
- Advisors should challenge the user's assumptions when that is what makes sense from their perspective
- Advisors should surface their own background only where directly relevant and useful (i.e. we want to avoid the “encyclopedia effect” that happens with real named people, where it seems like the LLM is trying to demonstrate its knowledge of the person rather than roleplaying them)
- Conversation should progress toward greater clarity rather than circular discussion
- (Non-MVP) System should detect when a perspective has been exhausted and suggest bringing in different advisors or changing current ones (see 1.4 above). 

#### Quality Metrics for Problem Exploration

- Sentiment shift in user responses (from negative/constrained to positive/expansive)
- Presence of "insight markers" in user language ("I hadn't thought of that," "That's a new perspective," etc.)
- Conversation length, both in terms of turns taken and in terms of how often the user returns to the same conversation more than 2 hours since the last engagement

### 2.1 Problem Exploration Sub-Journeys

#### 2.1.1 First Input Journey

##### Goals

- Lower the barrier to entry for users who may feel uncertain about how to begin
- Provide natural conversation starter that invites reflection
- Set the tone for a thoughtful, exploratory conversation
- Gently guide users toward articulating their situation in a way that advisors can meaningfully respond to

##### User State at Start

The user has selected their advisors and is looking at an empty conversation screen. They may feel a mixture of curiosity, uncertainty, and possibly mild anxiety about how to articulate their situation effectively. They might be hesitant about what level of detail to provide or how to frame their question.

##### User State at End

The user has successfully started the conversation with a prompt that feels authentic to them and adequately captures the essence of what they want to explore. They feel a sense of commitment to the process and anticipation about the perspectives that will emerge.

##### Process Constraints

- System should offer a simple, open-ended starter question (e.g., "What's on your mind today?")
- The interface should make it visually clear that the user can either respond to this question or type their own prompt
- The system should provide a visible option to access saved prompt templates
- First-time users should receive a brief tooltip explaining that more detailed initial prompts often lead to more helpful advisor responses

##### Quality Metrics

- Length and detail level of initial user prompts
- Proportion of conversations where users use system-suggested starters vs. writing their own
- Abandonment rate at the first input stage

#### 2.1.2 Seed Prompt Selection Journey

##### Goals

- Provide users with well-crafted templates that model effective prompts
- Help users who know their topic but struggle with how to frame it effectively
- Expose users to different categories of exploration (decision-making, creative thinking, etc.)
- Reduce cognitive load for return users exploring familiar territory

##### User State at Start

The user has a general sense of what they want to explore but may benefit from structure or inspiration for how to articulate their prompt. They may be considering whether to use a template or create their own prompt from scratch.

It is also possible that the user is returning to a conversation that is already of some length. However, they are returning after some period of time and looking to initiate a new round of conversation within the whole, which may or may not explore the same themes as similar rounds.

##### User State at End

The user has selected and possibly customized a seed prompt that feels relevant to their situation. They feel confident that this prompt will help guide the conversation in a productive direction and set the right context for advisor responses.

##### Process Constraints

- Seed prompts should be organized in easily scannable categories
- Each prompt should have clear placeholder text to guide customization
- Selection interface should be non-disruptive to the conversation flow
- (Non-MVP) System should track which prompts the user has used previously and highlight them
- Templates should be diverse in both topic and structure

##### Quality Metrics

- Usage rate of different seed prompt categories & default templates
- Customization rate (how often users modify templates before sending)
- Correlation between seed prompt usage and conversation depth/length

#### 2.1.3 Context Setting Journey

##### Goals

- Help users provide rich background information that advisors can reference
- Encourage users to articulate multiple dimensions of their situation
- Set appropriate expectations for the depth and type of advisor responses
- Create a foundation for ongoing conversation that maintains coherence

##### User State at Start

The user has initiated a round of conversation (either with their own prompt or a template) and is in the process of providing context. They may be uncertain about how much detail to include or which aspects of their situation are most relevant.

NOTE: A round of conversation is defined here as a conversation that a) begins more than 1 hour after the previous message, based on timestamps, or b) has been marked as a completed round (see Closure journey below). 

##### User State at End

The user feels they have successfully communicated the essential context of their situation. They believe the advisors have sufficient information to provide meaningful perspectives, and they feel ready to engage with the responses that emerge.

(In practice, the line between context setting and perspective exploration will be nebulous, but it seems useful to get a sense of it as a distinct step.) 

##### Process Constraints

- System should recognize when a new round of conversation has begun, acknowledge the time difference, and not assume that the situation is the same as before the break
- System should provide gentle guidance about helpful context elements (without being prescriptive)
- If the user's initial prompt is very brief, advisors should ask clarifying questions
- System should maintain a "context summary" that can be referenced by both the user and advisors
- Context setting should feel conversational rather than like filling out a form

##### Quality Metrics

- Completeness of situational context (will need to devise a multi-criteria measure for this)
- Amount of turns taken to achieve baseline situational context

#### 2.1.4 Perspective Exploration Journey

##### Goals

- Facilitate deep, multi-perspective examination of the user's situation
- Regularly make visible the user's current understanding and metaphorical frames
- Suggest alternative frames and approaches that emerge naturally from each advisors’ perspective
- Maintain a balanced dialogue where advisors apply their distinct perspectives (without drifting into a homogenous mush)
- Help the user identify patterns, assumptions, and blind spots in their thinking

##### User State at Start

The user has provided context and begun engaging with initial advisor responses. They may feel a mix of curiosity, hopefulness, and some uncertainty about whether this process will lead to meaningful insights. They are open to exploration but may be somewhat attached to their existing framing of the situation, or perhaps unaware of it.

##### User State at End

The user has experienced a series of perspective shifts and "aha moments." They can see their situation from multiple angles and have a more nuanced understanding of the dynamics involved. Their thinking has become more flexible, and they feel less stuck in rigid patterns. The conversation has moved from surface-level considerations to deeper values, patterns, or insights. The user feels ready to begin consolidating their insights before closing out the session.

##### Process Constraints

- Each advisor should maintain a distinct perspective while building on what has been shared
- System should ensure balanced participation across advisors
- System should modulate between challenging and supporting the user, using sentiment analysis to judge what’s appropriate
- Conversation should naturally move toward greater depth and integrity rather than circling on the same points (i.e. should detect loops and point them out)
- Advisors should disagree with each other when that is what their perspectives lead to
- System should avoid sycophancy—confirming or validating the user’s narratives and frames by default or without providing clear and concrete reasoning and evidence
- When the user attempts to out-source important questions or decisions (to get the system to decide something for them), the system should decline to make such decisions and respond with further curiosity, seeking to increase its own context awareness and the user’s

##### Quality Metrics

- Length of conversation (in turns and in overall length of user inputs)
- Depth ratings for conversational turns (tracking movement from surface-level discussion to deeper insights)
- Diversity of perspectives per turn (averaged across the conversation)
- User engagement depth (average length of user responses)
- Frequency of insight markers in user language
- Emotional tone shift between user messages (e.g., from frustrated to curious, or from anxious to contemplative)
- Occurrence of cross-advisor synthesis (advisors building on each other's perspectives)
- Occurrence of cross-advisor disagreement
- Sycophancy rating of advisor outputs (if they confirmed the user’s view, did they provide compelling evidence for it?)
- Occurrence of advisors refusing to make decisions for the user

#### 2.1.5 Conversation Closure Journey

##### Goals

- Help users recognize when they've reached a natural point of completion for this phase of the conversation
- Prevent unhealthy patterns of overuse
- Consolidate key insights and perspective shifts that emerged during the conversation
- Create a sense of meaningful resolution while acknowledging the possibility of continuation in the same conversation thread later
- Facilitate practical integration of insights into the user's life beyond the conversation
- Support the user in determining potential next steps

##### User State at Start

The user has experienced meaningful exploration and multiple perspective shifts. They sense that they've reached a natural plateau in the conversation and are ready to integrate what they've learned. They may feel intellectually stimulated, emotionally satisfied, or simply fatigued from deep engagement.

##### User State at End

The user feels a sense of completion and integration. They can articulate key insights from the conversation and have a clearer sense of how to apply these insights moving forward. They feel the conversation has been valuable and worth the time invested. They may have identified specific actions to take or areas for further exploration in future conversations. They are ready to leave the app.

##### Process Constraints

- System should recognize natural completion signals in user language
- Advisors should first prompt the user to summarize key insights from the conversation, helping them only secondarily or if requested
- Closure should feel like a natural culmination rather than an abrupt ending
- System should provide options for saving insights
- Advisors should acknowledge both intellectual insights and emotional/energetic shifts
- Closure process should help transition from exploratory thinking to practical application
- System should provide an actual closing ritual of some kind that invites the user to move out of the conversation interface
- System should mark the end of the conversational round for later reference

##### Quality Metrics

- Quality of user-generated summaries (comprehensiveness and insight integration)
- Satisfaction ratings of user closure language
- Follow-up conversation rate (users returning to same conversation thread to continue exploration)
- Save/export rate of conversation insights
- Frequency of users explicitly acknowledging value received from the conversation

## Seed Prompts

SPACE Terminal will offer users a curated list of seed prompts to initiate meaningful conversations with their advisors.

### Types of Prompt Templates

The system will include an array of pre-written prompts, categorized, for instance (categories not fully set yet, but something like):

Practical Problem-Solving
Philosophical Dialogue
Emotional Inquiry
Journaling
Just for Fun

### Implementation Requirements

1. Each prompt template category should display in a pop-out accordion menu when the user clicks a "Saved Prompts" button.
2. Templates should be organized by category with 3-5 templates per category.
3. When selected, the template text should auto-populate the message input field, allowing the user to customize it before sending.
4. The system should track which templates are most frequently used and present those higher in the list over time.
5. Users should be able to save their own custom prompts to the template library for future use.

The engineering team may expand this initial set of templates based on user testing, but should maintain the structure of offering prompts that encourage multi-perspective thinking and spaciousness.

## High-Level Evaluation Metrics

To track the overall health of the product and its value to users, we will measure:

- **Conversation Length**: Number of user turns per conversation
- **Sentiment Markers**: Frequency of value acknowledgment phrases ("that's helpful," "I see now"), signaling moments of genuine insight
- **Conversations Per User**: Total conversation threads initiated, revealing if users find value across multiple situations
- **Return Sessions**: Count of distinct days with active usage, showing ongoing utility in users' lives
- **Return Frequency**: Average time between return visits, indicating how SPACE fits into users' natural rhythm of seeking clarity

We will also count:

- Instances of specific value acknowledgments (e.g., "that's helpful," "I hadn't considered that")
- Level of productive challenge (were difficult perspectives offered?)
- Evidence of new connections or insights in user responses
- Instances of sycophantic patterns (excessive agreement without evidence)

## Open questions

A list of random thoughts/questions that pop up as we iterate on this doc. We'll post tentative answers as we iterate on this doc.

- How can we meaningfully define and measure sycophancy?

- To what extent should context setting and exploration be treated as distinct, both in the user flow and in the metrics we’re using? 

### How will this doc be used?

The point of the evals is to help us identify regressions within this user journey, or to help improve the quality of this journey. For evals, pay particular attention to the following direct LLM calls within the product flow:

1. **Advisor Creation LLM Calls**
    - Generating advisor descriptions from user input (minimal prompt to full description)
    - Evaluating semantic similarity between advisors
    - Processing worksheet responses to recommend suitable advisors
    - Modifying advisor descriptions during evolution (post-MVP)
2. **Conversation LLM Calls**
    - Generating advisor responses throughout the conversation
    - Generating AI-assisted summaries at closure points
    - Transforming seed prompts into personalized versions
3. **System Function LLM Calls**
    - Detecting natural endpoints in conversations
    - Extracting key insights from conversation history
    - Generating context summaries for reference
