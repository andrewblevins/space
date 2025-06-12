Privacy Brainstorm:

Let's say I'm a user considering using SPACE. What do I care about in terms of privacy? 

I want to be sure that my conversation text never goes into any server-side logs. Because that information could be used against me, or might just be embarrassing for another human to read. 

I don't expect any humans at Anthropic or OpenAI to be reading my chat logs. What would need to be true for the user to have that same expectation about SPACE? 

Where does that expectation come from for me, about Anthropic for instance? 
- Anthropic is a company, not an individual. 
- Incentives are aligned.
- If company fucks up, it publicly affects future career prospects of Anthropic employees. Reputation. 
- The product itself is magical, so it seems unlikely that sheer negligence will happen, like making the database world-readable. Competence. 
- They pay their employees so well, so they must be trustworthy, providing real value, etc. 
- I want to believe it's not screwing me because it's so useful. If I thought it wasn't trustworthy I wouldn't get to use it. "I want to believe." 

The question is, how does SPACE demonstrate trustworthiness? Skin in the game. Costly signal. 

- Partly just by working really well, being magical.
- Not over-signaling privacy concerns. 
- If people have questions, very clear about what we're doing and how what we're doing creates more value for you in direct, tangible ways. 
- Charging enough that people feel like incentives are aligned and there's real value. 
- Built by an official-sounding company, not just some guy. 
- Direct line for talking through concerns. Being maximally responsive (when user count is low). 

Varun would be comfortable with me having access to raw conversation logs. Concern is if it's vibe-coded, what if Claude made some kind of insane config choice that causes problems? For instance, used Supabase to store the persistent conversations and when it's fetching conversations from the database to the front-end, query is written wrong so it makes an error with user keys. Join should fail but doesn't, so now someone else with same name can suddenly see conversations. 