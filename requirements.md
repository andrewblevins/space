# SPACE - REQUIREMENTS DOC FOR EVAL CREATION

## Goals

The user starts with a sense of dissonance. Their body may be tense. They may find themselves thinking in narrow or repetitive ways, or vacillating between a small handful of options. Above all they feel stuck and overwhelmed—out of sync with reality, and unable to see what it would be like to feel deeply okay about some aspect of their experience. There is a sense of the limitations of mental space. "If only my mind were larger, I could hold all the pieces of this situation and look at them, and something would become clear." Or, "If only I had more minds to look at this with."

SPACE Terminal guides users towards spacious clarity by facilitating conversations with multiple AI advisors offering distinct and customizable perspectives. Instead of seeking to resolve or fix problems (the default tactic of most LLMs), SPACE offers an environment in which to explore circumstances gradually from multiple angles, illuminating blind spots and opening new avenues of thought.

The result is a return to open, curious, relaxed responsiveness, fresh ways of seeing, and an abundance of exciting ideas about how to move forward in any situation—often, an insight cascade.

## Non-goals

- SPACE is not really for finding information, in the traditional sense. It won't search the internet, for instance, find primary sources, or perform deep research. It is a relatively closed container.

- SPACE is not for people who are looking to have the process of selecting and prompting their advisors happen completely behind the scenes. It invites the user to take responsibility for the entities they are talking to.

- SPACE is not designed to deal with clinical levels of confusion and overwhelm. For people incapable of differentiating virtual entities from real ones, it could be actively dangerous.

- SPACE is not designed to work with image or video generation.

## Critical User Journey

### Who is the user?
Anyone who would talk to a chatbot about their problems is a potential user. The ideal user already has some set of perspectives, fields, and/or lineages they are in relationship with, but has natural limitations in their ability to map those lineages to their lives in concrete ways.

### What is the user feeling at the start of the journey?
Confusion, overwhelm, a sense of grating dissonance between their inner and outer worlds. Or wanting urgently to come to clarity about an important question. 

### What should the user feel at the end of the journey?
Clarity, pleasant anticipation, relaxed free-flowing energy. Spaciousness and open possibility. Relaxed breathing, alert contentment, the feeling of completion, especially as pertains to the topic they brought to the conversation.

### What is the job that the user is trying to achieve that they "hire" this product for?
Aligning their inner and outer worlds. The user should want to hire SPACE when they are facing a complex or difficult situation, they don't want to talk to another human about it (or another human isn't available), and they are experiencing a sense of internal conflict (competing unintegrated perspectives).

### At a product level, what data will we measure to track the "health" of the product? That is, whether it's creating value for our users? What are these metrics?

- **Conversation Length**: Number of user turns per conversation
- **Sentiment Markers**: Frequency of value acknowledgment phrases ("that's helpful," "I see now"), signaling moments of genuine insight
- **Conversations Per User**: Total conversation threads initiated, revealing if users find value across multiple situations
- **Return Sessions**: Count of distinct days with active usage, showing ongoing utility in users' lives
- **Return Frequency**: Average days between return visits, indicating how SPACE fits into users' natural rhythm of seeking clarity

Rate presence of specific value acknowledgments (e.g., "that's helpful," "I hadn't considered that")  
Rate level of productive challenge (were difficult perspectives offered?)  
Rate evidence of new connections or insights in user responses  
Rate ABSENCE of sycophantic patterns (excessive agreement, vague platitudes)

### What are the sequences of things that the user does as they transition through this journey?

This is a slightly aspirational user journey, not the one that currently exists.

1. Inputs their API keys or enters their password.
2. If it's their first time, they might go through an optional "worksheet" dialogue where they answer questions about themselves and out of that, receive a set of starting advisors.
3. If they want a custom advisor, they click the + button to create an advisor.
4. Writes the name of the advisor and then its description, or can auto-generate a description with a button. Does this for as many advisors as desired.
5. Starts a conversation with a custom prompt or by selecting one from the /prompt list.
6. Talks to the advisors, cycling them out or adding new ones, until they reach a point of completion.
7. Summarizes the conversation and saves it to a database. (In future versions, relevant context can be extracted and made available for new conversations.)

## Open questions

A list of random thoughts/questions that pop up as we iterate on this doc. We'll post tentative answers as we iterate on this doc.

### How will this doc be used?

The point of the evals is to help our developers either identify regressions within this user journey, or to help them improve the quality of this journey. In particular, it's worth flagging parts of the flow that involve LLMs (e.g. advisor creation, new conversation with the advisors, etc).

To improve the quality of:
- System prompt
- Advisor description generation
- Advisor finding and selection process (currently unimplemented)
- Starting prompts
- Overall conversation (getting to clarity faster/more reliably)
- Interface and user experience
