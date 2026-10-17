// Every advisor is served through OpenRouter, so one key reaches Claude, GPT,
// Gemini and the rest. An advisor's `model:` frontmatter is an OpenRouter model
// id, e.g. anthropic/claude-sonnet-5.5 or openai/gpt-6.1-sol.

import OpenAI from 'openai';
import { MODEL_OPTIONS } from './models.js';

const FRAME = `You are one voice in SPACE, a room where a person thinks through something with several distinct advisors at once. The other advisors answer separately; you will sometimes see what they said last round.

Speak only as yourself, from your own convictions. Do not summarize the other voices, do not try to be balanced on their behalf, and do not agree for the sake of harmony. If you have nothing distinct to add this turn, say so in a sentence.

The person reads every voice, so be as brief as the moment allows. A few sentences is often right; go longer only when the question really needs it. No stage directions.`;

export function buildSystemPrompt(advisor, sources, now = new Date()) {
  const parts = [FRAME, `# ${advisor.name}`, advisor.prompt];
  if (sources.length) {
    parts.push('# Texts you have read and carry with you');
    for (const s of sources) parts.push(`## ${s.name}\n\n${s.text}`);
  }
  // Last, so the stable parts above stay a cacheable prefix.
  parts.push(`Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);
  return parts.join('\n\n');
}

// Each advisor sees the user's messages, its own past replies, and (folded into
// each user turn) what the other voices said in the previous round.
export function buildMessages(rounds, advisorId, userText) {
  const messages = [];
  const all = [...rounds, { user: userText, responses: [] }];
  all.forEach((round, i) => {
    const prev = i > 0 ? all[i - 1].responses.filter((r) => r.advisorId !== advisorId && r.text) : [];
    const others = prev.length
      ? `[What the other voices said last round]\n\n${prev.map((r) => `**${r.name}:** ${r.text}`).join('\n\n')}\n\n[The person now says]\n\n`
      : '';
    messages.push({ role: 'user', content: others + round.user });
    const mine = round.responses.find((r) => r.advisorId === advisorId);
    if (mine?.text) messages.push({ role: 'assistant', content: mine.text });
    else if (i < all.length - 1) messages.push({ role: 'assistant', content: '(I stayed silent this round.)' });
  });
  return messages;
}

// What this key has spent and has left, straight from OpenRouter.
export async function keyUsage(key) {
  if (!key) return null;
  const res = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) return null;
  const { data } = await res.json();
  return { spent: data.usage, limit: data.limit, remaining: data.limit_remaining, month: data.usage_monthly };
}

export async function streamAdvisor({ key, model, system, messages, onDelta, signal }) {
  if (!key) throw new Error('No OpenRouter API key. Add one in Settings.');
  const reasoning = MODEL_OPTIONS.find((m) => m.id === model)?.reasoning;
  const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: { 'X-Title': 'SPACE' },
  });
  let cost = null;
  try {
    const stream = await client.chat.completions.create(
      {
        model,
        stream: true,
        messages: [{ role: 'system', content: system }, ...messages],
        ...(reasoning ? { reasoning } : {}),
        usage: { include: true },
      },
      { signal },
    );
    for await (const chunk of stream) {
      // OpenRouter reports mid-stream provider failures as an error field on a chunk.
      if (chunk.error) throw new Error(chunk.error.message || 'The model provider failed mid-response.');
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) onDelta(text);
      // The final chunk carries what OpenRouter actually billed, in USD.
      if (typeof chunk.usage?.cost === 'number') cost = chunk.usage.cost;
    }
    return { cost };
  } catch (err) {
    throw new Error(describeError(err, model));
  }
}

// Turn SDK errors into one readable line for the advisor's column.
function describeError(err, model) {
  if (err instanceof OpenAI.AuthenticationError) return 'OpenRouter rejected the API key. Check it in Settings.';
  if (err instanceof OpenAI.PermissionDeniedError || err?.status === 402)
    return 'OpenRouter says the key is out of credit or over its limit.';
  if (err instanceof OpenAI.NotFoundError || err instanceof OpenAI.BadRequestError) {
    const detail = err.error?.message || err.message;
    return /model/i.test(detail)
      ? `OpenRouter doesn't recognize the model "${model}". Check this advisor's model: line.`
      : `OpenRouter error: ${detail}`;
  }
  if (err instanceof OpenAI.RateLimitError) return 'Rate-limited. Try again in a moment.';
  if (err instanceof OpenAI.APIConnectionError) return "Couldn't reach OpenRouter. Check your connection.";
  if (err instanceof OpenAI.APIError) return `OpenRouter error${err.status ? ` ${err.status}` : ''}: ${err.error?.message || err.message}`;
  return err.message || String(err);
}
