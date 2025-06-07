# Purpose

## Purpose of This Document

This document outlines the product requirements for SPACE Terminal. It is specifically geared toward providing the level of specificity needed to begin writing useful evals for the product, but could also be used as a general guide to creating v0 of the product. 

A few aspirational features are also described, marked "non-MVP" where they appear.

## Core User Problem & Solution

Users come to SPACE when experiencing cognitive or emotional constriction - they feel stuck between limited options, overwhelmed by complexity, unable to integrate conflicting perspectives. This could manifest as:
- Business decisions with multiple stakeholders and complex tradeoffs
- Personal situations requiring emotional integration
- Strategic planning needing diverse expertise
- Life transitions demanding multiple viewpoints

The key user need is to expand their mental space beyond what a single perspective (their own or a standard AI assistant's) can provide.

SPACE solves this by facilitating conversations with multiple AI advisors that:

1. Offer genuinely distinct perspectives - whether domain expertise, stakeholder viewpoints, or thinking styles
2. Hold the relevant details of the situation in memory
3. Illuminate possibilities, patterns, or blind spots the user would not have considered alone
4. Support both analytical decision-making and emotional processing as needed

## Non-goals

- SPACE is not designed to be addictive, in fact we want to take measures to prevent compulsive use of the app and steer the user toward leaving it when they achieve completion on their problem.
- SPACE is not really for finding information, in the traditional sense. It won't search the internet, for instance, find primary sources, or perform deep research. It is a relatively closed container.
- SPACE is not for people who are looking to have the process of selecting and prompting their advisors happen completely behind the scenes. It invites the user to take responsibility for the entities they are talking to.
- SPACE is not designed to deal with clinical levels of confusion and overwhelm. For people incapable of differentiating virtual entities from real ones, it could be actively dangerous.
- SPACE is not designed to work with image or video generation. 

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