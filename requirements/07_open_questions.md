# Open Questions

A list of random thoughts/questions that pop up as we iterate on this doc. We'll post tentative answers as we iterate on this doc.

- How can we meaningfully define and measure sycophancy?
- To what extent should context setting and exploration be treated as distinct, both in the user flow and in the metrics we're using? 

## How will this doc be used?

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