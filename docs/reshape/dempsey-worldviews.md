# Dempsey worldviews research

Research notes for the "advisors as believers with distinct worldviews" direction. Post-MVP concern — do not build on this until the markdown port is done and the kill-if window has passed.

Date: 2026-04-09.

## TL;DR

Andrew's hunch was partly right and partly off. Dempsey does use a structured worldview interview on the Jim Rutt Show, but **the interview instrument itself isn't his invention** — it's James Fowler's **Faith Development Interview (FDI)**, a well-documented published protocol from 1981. Dempsey's original contribution is the **theoretical frame** he brings to it: applying hierarchical complexity, neo-Piagetian developmental theory, and his metamodern synthesis to interpret the results.

**Practical consequence:** Andrew does *not* need to reach out to Dempsey to get the interview instrument. Fowler's FDI is in the academic literature and can be sourced directly. What Dempsey adds is interpretation and integration — useful for understanding *what to do with* the answers, but not required to run the interview itself.

## The episode

- **EP 332: Worldviews: Jim Rutt**
- Aired **February 17, 2026**
- Brendan Graham Dempsey interviews Jim Rutt using what the show page explicitly calls "a faith development interview"
- https://www.jimruttshow.com/worldviews-jim-rutt/
- This is part of a new **"Worldviews" series** on the Jim Rutt Show

Related prior episodes:
- **EP 328** — Dempsey interviews Rutt on "Minimum Viable Metaphysics" (https://www.jimruttshow.com/jim-rutt-brendan-graham-dempsey/)
- **EP 322** — Dempsey on Psyche and Symbolic Learning (https://www.jimruttshow.com/brendan-graham-dempsey-4/)
- **EP 172** — Dempsey on Emergentism (earliest appearance)

## The instrument: Fowler's Faith Development Interview

The FDI is a semi-structured interview protocol developed by **James Fowler** at Emory University, published in his 1981 book *Stages of Faith: The Psychology of Human Development and the Quest for Meaning*. It was designed to assess stages of faith development (Fowler proposed six stages, from intuitive-projective through universalizing). The interview is roughly 2–3 hours and is organized into sections. Based on the EP 332 description and the published FDI literature, the sections cover:

1. **Life review / life chapters.** The subject divides their life into chapters and narrates each one. Purpose: surface formative experiences, key relationships, and turning points.
2. **Relationships.** Family of origin, significant others, current close relationships. Purpose: surface what the subject invests meaning in.
3. **Present values and commitments.** What matters most now? What do you live for? What would you sacrifice for? (The EP 332 page singled this out as "the real heart of it.")
4. **Religion and worldview.** Beliefs about God, the sacred, the supernatural, ultimate reality. Sources of authority. Experiences of the holy or transcendent. Views on death, suffering, evil.
5. **Decision-making.** How do you make hard choices? What frameworks do you use? How do you weigh competing goods?

The interview is open-ended; the interviewer follows the subject's narrative rather than administering a fixed battery. Coding happens afterward by trained raters using a published manual.

**The full FDI protocol and scoring manual are published.** Primary sources to pull:
- Fowler, J. W. (1981). *Stages of Faith.* HarperOne. (The book; has an appendix with the interview guide.)
- Fowler, J. W., Streib, H., & Keller, B. (2004). *Manual for Faith Development Research.* Third edition. Research Center for Biographical Studies in Contemporary Religion, University of Bielefeld. (The detailed scoring manual — this is the one to actually use.)
- Streib, H., & Keller, B. (2018). *Manual for the Assessment of Religious Styles in Faith Development Interviews.* (Bielefeld update.)

The Bielefeld manual is the live, maintained version and is the standard in the field. It is available as a PDF through the University of Bielefeld's research archive — a straightforward web search should turn it up.

## Dempsey's theoretical layer

Dempsey is not *just* administering the FDI. He interprets it through a specific theoretical stack. The relevant frameworks:

- **Model of Hierarchical Complexity (MHC)** — Michael Commons et al. A framework for quantifying the sophistication of thinking across domains. Dempsey applies this to cultural artifacts and worldviews to ask "how complex is this worldview, in measurable terms?"
- **Neo-Piagetian developmental psychology** generally — Kegan's orders of consciousness, Cook-Greuter's ego development stages, Commons's MHC.
- **Metamodernism** — Dempsey's own synthesis, articulated in his book *Metamodernism: Or, The Cultural Logic of Cultural Logics* (2023) and his multi-volume *Evolution of Meaning* series. His operative definition of "worldview":

  > a constellation of working assumptions about the world acting as knowledge, by which people navigate reality in a relatively effective manner

  He uses this "largely interchangeably with other terms such as 'justification system,' 'episteme,' or 'metameme.'" (Source: WebSearch summary of his Substack; verify against https://brendangrahamdempsey.substack.com/p/chapter-6-worldview-from-metamodernism before quoting.)

- **Institute of Applied Metatheory** — where Dempsey is Director of Research. His current work is on "the complexification of worldviews and human meaning-making systems across scales."

Relevant interview with Dempsey on this specific question: *"Brendan Graham Dempsey: Can We Scientifically Measure Worldviews?"* — The Living Philosophy podcast/Substack, https://www.thelivingphilosophy.com/p/5-brendan-graham-dempsey-can-we-scientifically. Worth a full read before any implementation work.

## What's directly usable for SPACE's advisor design

If the goal is to give SPACE advisors **distinct, coherent worldviews** rather than the current "name + description + color" model, the FDI structure gives a ready-made schema. An advisor markdown file could carry fields like:

```yaml
---
name: The Pragmatist
worldview:
  life_story: |
    ...formative chapters...
  central_relationships: |
    ...
  present_values_and_commitments: |
    ...what they live for, would sacrifice for...
  ultimate_reality: |
    ...beliefs about the sacred, the supernatural, death, suffering...
  decision_framework: |
    ...how they reason about hard choices...
  developmental_stage: # optional, Dempsey/Commons-style
    kegan_order: 4
    fowler_stage: "individuative-reflective"
---
```

This gives the LLM a much richer scaffold than a paragraph-long description. It also provides a structured way to *interview* a user to build an advisor based on a real person or tradition — you walk them through the FDI questions about the figure, and the answers become the frontmatter.

**But again: this is post-MVP.** Don't build it until the markdown port is shipped and you've tested the kill-if.

## Do we need to contact Dempsey?

**No, not to get the instrument.** The FDI is published; the Bielefeld manual is the canonical source. Fowler's 1981 book is the readable version.

**Maybe, later, for these things:**
- How Dempsey specifically adapts or extends the FDI for his Worldviews series. If the EP 332 transcript is published, it'll show his exact question flow, which may differ from Fowler's. Check https://jimruttshow.blubrry.net/the-jim-rutt-show-transcripts/ for a transcript.
- Whether he's published his interpretive framework (MHC + metamodernism applied to FDI results) in a form that could be used programmatically. His Substack (https://brendangrahamdempsey.substack.com) is the place to look; the *Chapter 6: Worldview* post from his *Metamodernism* book is a starting point.
- If after reading the available sources the interpretive frame is still unclear, *then* reach out. He's publicly accessible through his Substack.

## Confidence flags

- **High confidence:** EP 332 exists, aired Feb 17 2026, uses an FDI format. Fowler's FDI is published and canonical. Dempsey's theoretical stack includes MHC, neo-Piagetian frameworks, and metamodernism.
- **Medium confidence:** The specific section structure I listed above reflects a blend of the EP 332 show-page description and my general knowledge of the Fowler protocol. Verify against the Bielefeld manual before writing code against this schema.
- **Low confidence / to verify:** Exact wording of Dempsey's operative worldview definition (quoted from a search summary, not from the primary source). Whether Dempsey has an adapted/extended protocol beyond vanilla Fowler. Whether EP 332 has a public transcript yet.

## Sources

- [EP 332 Worldviews: Jim Rutt — The Jim Rutt Show](https://www.jimruttshow.com/worldviews-jim-rutt/)
- [EP 328 Brendan Graham Dempsey Interviews Jim Rutt on Minimum Viable Metaphysics](https://www.jimruttshow.com/jim-rutt-brendan-graham-dempsey/)
- [EP 322 Brendan Graham Dempsey on Psyche and Symbolic Learning](https://www.jimruttshow.com/brendan-graham-dempsey-4/)
- [Metamodernism as a Worldview (Chapter 6) — Dempsey Substack](https://brendangrahamdempsey.substack.com/p/chapter-6-worldview-from-metamodernism)
- [Brendan Graham Dempsey: Can We Scientifically Measure Worldviews? — The Living Philosophy](https://www.thelivingphilosophy.com/p/5-brendan-graham-dempsey-can-we-scientifically)
- [Dempsey's Metamodern Spirituality site](https://www.brendangrahamdempsey.com/)
- [The Jim Rutt Show transcripts](https://jimruttshow.blubrry.net/the-jim-rutt-show-transcripts/)
