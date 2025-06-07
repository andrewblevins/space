# Advisor Creation Journey

## Goals

- Enable users to generate AI advisors within minutes
- Help the user create advisors that are sufficiently differentiated in their approaches, values, and thinking styles
- Create a balanced panel of advisors that can illuminate different aspects of a problem

## Non-goals

- Creating advisors that give harmful, unethical, or dangerous advice
- Artificially limiting the number or types of advisors users can create
- Assuming users need only a small, balanced panel (some situations benefit from 20+ specialized perspectives)

## User State at Start

The user feels curious but potentially uncertain about what perspectives would be most helpful for their situation. They may have some ideas about what kinds of advisors they want but need guidance on articulating specific perspectives.

## User State at End

The user feels confident that they have assembled a diverse panel of advisors that will provide meaningfully different angles on their situation. They understand the perspective each advisor brings and feel a sense of positive anticipation about engaging with them.

## Constraints on Advisor Creation

- Each advisor must have a clearly defined perspective, background, or thinking style
- Each advisor description should be more than 100 words to ensure sufficient detail
- System should nudge the user to revise advisor descriptions that are too vague or too similar to currently active advisors

## Quality Metrics for Advisor Creation

- Frequency with which user accepts generated advisors without revision
- Number of completed rounds with generated advisors

## Advisor Abundance Philosophy

SPACE embraces an "abundance over curation" approach to advisors:
- Users can create unlimited advisors without restrictions
- Complex decisions may benefit from 20-30+ specialized perspectives
- Users naturally self-organize advisors into categories (experts, stakeholders, process facilitators)
- The system should encourage exploration of "who else might help?" rather than limiting options

## Advisor Creation Sub-Journeys

The Advisor Creation journey can be broken down into three distinct sub-journeys:

### 1.1. Worksheet-Based Advisor Generation Sub-Journey

#### Goals

- Help users who aren't sure what perspectives they need
- Get rich context about the user's background, values, interests, and thinking style
- Generate a balanced initial set of advisors tailored to complement the user's perspective

#### User State at Start

The user is facing a "cold start" problem. They may be uncertain what kinds of advisors would be most helpful, or want to generate options so that they can evaluate them and discover better what kinds of advisors they would like. They may also be curious to see if the worksheet process might reveal something new about themselves or suggest figures or traditions that would be useful for them. They prefer a guided approach rather than creating advisors from scratch.

#### User State at End

The user is looking at a fresh conversation. In the advisor panel, they have a set of 3-5 advisors that each provide distinct perspectives and together provide a balance of perspectives. They feel that the advisors are well-chosen. They have a sense of positive anticipation and are eager to see what interacting with these advisors will be like. The advisors are by default activated, i.e. will be injected into the next prompt.

#### Process Constraints

- Worksheet should take no more than 10 minutes to complete
- Suggested advisors should be different from the others along at least 3 substantial axes (e.g. methodology, values, field of expertise)
- Questions should build contextual understanding and use a range of question types to get a complex view of the person and their goals (for now we can just use the worksheets already in Insight Cascade)
- Final advisor suggestions should explicitly reference aspects of the user's input
- System should explain why each advisor was selected for the user
- User should have an opportunity to reject specific advisors and ask for new suggestions before the advisors are added to the advisors panel

#### Quality Metrics

- Completion rate of worksheet
- Number of questions answered on worksheet
- User acceptance rate of suggested advisors
**- Number of turns taken with suggested advisors**
- Length of advisor selection conversation

### Actionable Questions

1. Questions we considered

- What's the completion rate for the worksheet?
- How many questions do they answer on the worksheet?
- Which questions do users tend to answer on the worksheet? 
- How long does it take users to complete the worksheet? 
- How many turns does the user take with the suggested advisor board?
- How often does the user accept their suggested board without back-and-forth?
- How many conversational turns do users take in the advisor selection process between "advisors suggested" and acceptance of advisors? 
- How often do users go through the process? 
- How often do suggested advisors lead to high-quality conversations (as measured by exploration journey metrics)?
- How often do the suggested advisor panels meet our distinctiveness criteria (different on 3+ axes)?
- How often do suggested panels include perspectives that would naturally disagree with each other?
- Which specific worksheet questions correlate most strongly with good advisor suggestions?
- How often do users skip questions vs. providing thoughtful answers?
- Do the suggested advisors actually reflect the user's stated interests/values from the worksheet?
- How often do worksheet-generated panels lead to return usage compared to manually created panels?
- How long are conversations with worksheet-generated advisors compared with custom advisors? 
- Is this the right panel of advisors for the user's needs? 

1. Questions we picked and rationale

- What's the completion rate for the worksheet (as in, how often do people finish it after starting the process)?
  
  If completion rate is low, we will want to shorten the worksheet or make it more engaging somehow. 
  
- How long are conversations with worksheet-generated advisor panels? 

  This loosely indicates how well the panels are working. Longer conversations suggest deeper engagement and more user enjoyment.

- How long are conversations with worksheet-generated advisors compared with custom advisors? 

  This can be taken as a rough measure of how much the worksheet improves the richness, depth, and balance of an advisor panel. If it goes way up, we should nudge more towards the worksheet-based approach as a default option in the UI, since this means it will produce better results than the average user's creations. 

- How often do suggested advisors lead to high-quality conversations (as measured by exploration journey metrics)?

  Basic quality indicator.

- How often do the suggested advisor panels meet our distinctiveness criteria (different on 3+ axes)?

  This number determines how much we want to tweak the prompt to increase distinctiveness, or use stepwise reasoning chains to do so.

- How often do suggested panels include perspectives that would naturally disagree with each other on a battery of questions?

  Variation on the above, but more exacting. This determines how much we want to adjust prompts/process for more distinctiveness. It also gets into the deeper matter of "actually having a position" (which may want to be built in as a goal at higher levels of this document, now that I'm thinking about it).

- What percentage of the suggested advisors get added to the advisors panel? 

- What percentage of users make it from this journey to the next one, i.e. after doing this, start a conversation with their advisors? 

Target metric: Percentage of users who go through the worksheet process and then click Start Conversation with This Panel. 

What are things the AI should do more or less of to increase this metric? 

- Could give the usdr a clear and enticing sense or an example of what converation with this advisor or set would be like. (Give an example workthrough of a problem related to something the user said in the worksheets.)
- Could just like make really high-quality advisors and descriptions.
    - Advisors have compelling voices
    - Advisors are directly tied to traditions/lineages that the user expressed interest in (or that are latent in their values etc.)
    - Advisors are charming
    - Advisors convincingly display expertise that is relevant to the user's problems
- Faithfully follow the worksheet

Actionable Question: Does the system generate high-quality advisors and descriptions based on the basic worksheet? 

## 1.2. Advisor Creation Sub-Journey

### Goals
- Enable users to quickly create advisors representing specific perspectives they want to explore
- Support the full spectrum from manual creation to AI-assisted generation
- Ensure created advisors are well-defined and conversation-ready

### User State at Start
The user has a perspective or advisor concept in mind and wants to add it to their panel.

### User State at End
The user has a well-articulated advisor that captures their intended perspective and feels ready for meaningful conversation.

### Process Constraints
- Creation process should complete in under 2 minutes
- User enters advisor name and optionally writes description manually
- AI generation available on-demand via generate button (based on name + any existing text)
- All generated content remains fully editable
- Generation completes in under 10 seconds

### Quality Metrics
- Creation completion rate and time
- AI feature usage rate
- User satisfaction with final advisor descriptions
- Edit distance between generated and final descriptions

### Actionable Questions


1. Questions we considered

- Do the generated descriptions create advisor panels that score well on our evals for the problem exploration journey? 
- Does the generated advisor description elaborate well when given only a name to work with?
  - Are the descriptions substantive, i.e. do they elaborate and make concrete decisions internally rather than spooling out empty fluff on the general theme of the name?
- Do the generated descriptions cover a number of features of the advisor (e.g. thinking style, speaking style, background/lineage)?
- How often does the generated advisor offer a perspective that is meaningfully different from the user's? 
- How often do generated advisors disagree with each other? 
- How often do users abandon the creation process after generating a description? 
- Is the advisor's voice distinct from the model's default voice?
- How often do users revise the generated description? 

1. Questions we picked and rationales

- Do the generated descriptions create advisor panels that score well on our evals for the problem exploration journey? 

This seems to be where the rubber meets the road. I'm not clear on how, process-wise, we could draw correlations here (and at time of writing haven't determined evals for the problem exploration journey), but the point of the advisor panels is to afford good explorations, so these would be core quality indicators.

- Do generated-description advisors score better or worse than human-created advisors on evals for the problem exploration journey?

If so, we would want to find out what users are doing better and incorporate that into the prompting.

If generated-description advisors are performing drastically better, we may want to nudge users harder toward using them.

- How often do users abandon the creation process after generating a description?

This would suggest dissatisfaction with generated descriptions, so we would want to probe that and do more user testing if possible. 

- If the advisor is based on a real person, does it do a convincing job of imitating that person's voice (as displayed in publicly available texts, talks, etc.)?

This is a major quality differentiator. If models are doing a poor job imitating voices, we would want to create processes for having them collect richer data behind the scenes (e.g. go and download a PDF of so-and-so's work and use that to generate a voice profile).

- Is the advisor's voice meaningfully distinct from the default voice of the model? 

Even if advisors are not based on real people, we want them to have distinctive voices connected with their roles or thinking styles. If this performs poorly, we would want to adjust the prompts or create a reasoning process for generating distinct voices from seeds.

- If the advisor is connected with a specific lineage or tradition, does it accurately convey the principles and ideas of that tradition?

Essentially we want a fact-checking eval. If this is performing poorly, we would want to think about (again) finding ways to funnel in more background sources, or have more of the relevant ideas and principles injected into the generated advisor description, or something else. 

### 1.3. Advisor Evolution Sub-Journey (Aspirational, Post-MVP)

#### Goals

- Allow advisors to evolve or transform their perspectives based on conversation context
- Enable users to request modifications to advisor perspectives mid-conversation
- Create a sense of organic growth and adaptability in the advisory system

#### User State at Start

The user feels unsatisfied with one or more advisor, or feels that their perspective is no longer congruent for the situation. For instance, they may have been talking to three advisors for a long time, and feel that one of them is a "weak link" and not functioning as well as the others.

#### User State at End

The user feels a sense of creative agency and collaboration as they shape the advisory system to better suit their evolving needs. They experience the satisfaction of having advisors that can grow alongside their thinking.

#### Process Constraints

- Evolution should maintain an aspect of the advisor's identity while allowing meaningful shifts
- System should prevent harmful or manipulative transformations
- Changes should be traceable (user can see original vs. current perspective)
- Evolved advisors can be saved as new versions or variants for easy rollback

#### Quality Metrics

- Acceptance rate of evolved advisors (i.e. how often the user replaces the previous advisor with the new version)
- Retention of distinctiveness of perspective after evolution
- Proportion of evolved advisors that get reused in future sessions 