# SPACE reshape — desires, kill-if, and scope

Distilled from voice memo 2026-04-09 and the prior conversation with Claude. Keep this short. Update it when it stops being true.

## Heart's desire (two parts)

1. **Beautiful, satisfying interface.** A full-screenable panel of advisors that feels artful and generative to interact with — the kind of thing you'd *want* to open. Marble-bust imagery is a visual motif Andrew keeps seeing. The interface is load-bearing; it is not a commodity shell around "the real product."

2. **Steady inflow from people buying it.** Ideally a one-time license, not a subscription. Price point in the $20–$50 range feels plausible. This is partly about money and partly about getting market signal on whether the thing is genuinely helpful.

Tertiary but real: **Andrew actually uses it himself.** Currently he doesn't, and that's the deepest signal that something's wrong with the current form.

## Why the current web app doesn't get used

- Files live in browser localStorage. They're not *his files*. Can't grep, link, or fold into the rest of his thinking.
- It feels divorced from the Claude ecosystem — from Claude Code, from his Obsidian vault, from the places he actually works.
- API key acquisition is a cold-start tax.
- (Suspected, not MVP-blocking:) advisors aren't distinct enough — they don't feel like meaningfully different worldviews. This is a *content* problem, not a *shell* problem, and belongs to a later pass.

## What the reshape is (MVP scope)

- Port the existing React app to **run locally via `npm run dev`** in the user's browser.
- Replace **localStorage persistence with markdown-files-on-disk** in a legible, flexible folder layout.
- Each **advisor = its own folder**. Each **conversation = its own folder**. Markdown all the way down.
- **`@`-mention any markdown file** from anywhere on disk (Obsidian vault or otherwise) to pull it in as context — for advisor creation or for in-conversation reference.
- **Save any bit of a conversation back out** to a new markdown file.
- Keep the existing interface intact. **Do not redesign the UI.** Do not add features not in this list. Reuse the existing React app to the greatest extent possible.

## What the reshape is NOT (explicitly cut for MVP)

- Not a Tauri/Electron desktop app. Not yet. `npm run dev` + browser is fine for MVP.
- Not a Claude-subscription-auth integration. Andrew mentioned it ("GlassCode" as precedent from Max); it's interesting but explicitly not a deal-breaker. BYOK stays for MVP.
- Not the "advisors as believers with formalized worldviews" pass. That's a later layer informed by Dempsey research (see `dempsey-worldviews.md`).
- Not agent behavior. Advisors consult; they do not act. Andrew considered and rejected the agent framing.
- Not the protocol/GUI split as two sellable products. That's a business-model question, not an MVP-engineering question. Revisit after the port lands.
- Not solving cognitive overload (the "3–5× the text to read" problem). Acknowledged as a real UX issue; not on the MVP path.
- Not onboarding polish, no pricing page, no license enforcement, no Stripe integration.

## Kill-if

> *If, two weeks after the markdown-port MVP is usable, Andrew still doesn't reach for SPACE in his own daily work, the problem isn't the shell — it's the advisors themselves — and he should stop building interface and start building worldviews.*

Stated and agreed to on 2026-04-09.

## Primary test user

**Misha.** The forcing question for any MVP feature: *"Is this the version I can send Misha where setup is minimal and it integrates with whatever files he already has?"* If a feature doesn't pass that test, it doesn't belong in MVP.
