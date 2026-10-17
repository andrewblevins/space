// The vault is a plain folder of markdown. Everything SPACE knows lives here:
//
//   <vault>/advisors/<slug>/advisor.md      frontmatter (name, model) + the advisor's prompt
//   <vault>/advisors/<slug>/portrait.*      optional image shown in the panel
//   <vault>/advisors/<slug>/sources/*.md    optional texts the advisor has "read"
//   <vault>/conversations/<id>/conversation.md
//
// Users are expected to edit these files directly, in any editor.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const PORTRAIT_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const SOURCE_EXTS = ['.md', '.txt'];

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'untitled';
}

export function ensureVault(vaultPath, seedDir) {
  const advisorsDir = path.join(vaultPath, 'advisors');
  const isNew = !fs.existsSync(advisorsDir);
  fs.mkdirSync(advisorsDir, { recursive: true });
  fs.mkdirSync(path.join(vaultPath, 'conversations'), { recursive: true });
  if (isNew && seedDir && fs.existsSync(seedDir)) {
    fs.cpSync(path.join(seedDir, 'advisors'), advisorsDir, { recursive: true });
  }
}

// ---------- advisors ----------

export function listAdvisors(vaultPath) {
  const dir = path.join(vaultPath, 'advisors');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => readAdvisor(vaultPath, d.name))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export function readAdvisor(vaultPath, slug) {
  const folder = path.join(vaultPath, 'advisors', slug);
  const file = path.join(folder, 'advisor.md');
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, 'utf8'));
  const portrait = PORTRAIT_EXTS.map((ext) => `portrait${ext}`).find((f) =>
    fs.existsSync(path.join(folder, f)),
  );
  const sourcesDir = path.join(folder, 'sources');
  const sources = fs.existsSync(sourcesDir)
    ? fs
        .readdirSync(sourcesDir)
        .filter((f) => SOURCE_EXTS.includes(path.extname(f).toLowerCase()))
        .sort()
    : [];
  return {
    id: slug,
    name: data.name || slug,
    model: data.model || null,
    epithet: data.epithet || '',
    order: Number.isFinite(data.order) ? data.order : 1000,
    prompt: content.trim(),
    portrait: portrait ? `advisors/${slug}/${portrait}` : null,
    sources,
    file: `advisors/${slug}/advisor.md`,
  };
}

export function readAdvisorSources(vaultPath, advisor) {
  return advisor.sources.map((f) => ({
    name: f,
    text: fs.readFileSync(path.join(vaultPath, 'advisors', advisor.id, 'sources', f), 'utf8'),
  }));
}

const ADVISOR_TEMPLATE = (name) => `---
name: ${name}
epithet:
model: anthropic/claude-sonnet-5.5
---

Write this advisor in the second person. Everything below the line above is sent
to the model as this advisor's instructions, so delete this paragraph when you're done.

## Who you are

## What you hold to be true

## What you care about most, and what you would sacrifice for it

## Where your authority comes from

## How you make hard decisions

## What you distrust or push back on

## How you speak
`;

export function createAdvisor(vaultPath, name) {
  let slug = slugify(name);
  let n = 2;
  while (fs.existsSync(path.join(vaultPath, 'advisors', slug))) slug = `${slugify(name)}-${n++}`;
  const folder = path.join(vaultPath, 'advisors', slug);
  fs.mkdirSync(path.join(folder, 'sources'), { recursive: true });
  fs.writeFileSync(path.join(folder, 'advisor.md'), ADVISOR_TEMPLATE(name));
  return `advisors/${slug}/advisor.md`;
}

// Change only the model: line, leaving the rest of the file exactly as the user wrote it.
export function setAdvisorModel(vaultPath, slug, model) {
  const file = path.join(vaultPath, 'advisors', safeSegment(slug), 'advisor.md');
  const raw = fs.readFileSync(file, 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) {
    fs.writeFileSync(file, `---\nmodel: ${model}\n---\n\n${raw}`);
    return;
  }
  const body = /^model:.*$/m.test(fm[1])
    ? fm[1].replace(/^model:.*$/m, `model: ${model}`)
    : `${fm[1]}\nmodel: ${model}`;
  fs.writeFileSync(file, raw.replace(fm[1], body));
}

// ---------- conversations ----------
//
// Each turn is preceded by an HTML comment marker so the file reads cleanly in
// Obsidian or any markdown viewer but still parses back without ambiguity, even
// when responses contain their own headings.

const MARKER = /^<!-- space:(user|advisor)((?:\s+\w+="[^"]*")*)\s*-->\s*$/gm;

function attrs(raw) {
  const out = {};
  for (const m of raw.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2].replace(/&quot;/g, '"');
  return out;
}

const esc = (s) => String(s ?? '').replace(/"/g, '&quot;');

export function serializeConversation(convo) {
  const head = matter.stringify('', {
    title: convo.title,
    created: convo.created,
  }).trim();
  const parts = [head, ''];
  for (const round of convo.rounds) {
    parts.push('<!-- space:user -->', '## You', '', round.user.trim(), '');
    for (const r of round.responses) {
      const extra = r.error ? ` error="${esc(r.error)}"` : '';
      parts.push(
        `<!-- space:advisor id="${esc(r.advisorId)}" model="${esc(r.model)}"${extra} -->`,
        `## ${r.name}`,
        '',
        (r.text || '').trim(),
        '',
      );
    }
  }
  return parts.join('\n');
}

export function parseConversation(id, raw) {
  const { data, content } = matter(raw);
  const rounds = [];
  const markers = [...content.matchAll(MARKER)];
  markers.forEach((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : content.length;
    // drop the "## Heading" line that follows each marker
    const body = content.slice(start, end).replace(/^\s*## .*\n/, '').trim();
    if (m[1] === 'user') {
      rounds.push({ user: body, responses: [] });
    } else if (rounds.length) {
      const a = attrs(m[2]);
      const heading = content.slice(start, end).match(/^\s*## (.*)$/m);
      rounds[rounds.length - 1].responses.push({
        advisorId: a.id,
        model: a.model,
        name: heading ? heading[1].trim() : a.id,
        text: body,
        ...(a.error ? { error: a.error } : {}),
      });
    }
  });
  return {
    id,
    title: data.title || id,
    created: data.created ? new Date(data.created).toISOString() : null,
    rounds,
  };
}

export function listConversations(vaultPath) {
  const dir = path.join(vaultPath, 'conversations');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = path.join(dir, d.name, 'conversation.md');
      if (!fs.existsSync(file)) return null;
      const { data } = matter(fs.readFileSync(file, 'utf8'));
      return {
        id: d.name,
        title: data.title || d.name,
        created: data.created ? new Date(data.created).toISOString() : null,
        mtime: fs.statSync(file).mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
}

export function loadConversation(vaultPath, id) {
  const file = path.join(vaultPath, 'conversations', safeSegment(id), 'conversation.md');
  return parseConversation(id, fs.readFileSync(file, 'utf8'));
}

export function newConversationId(firstMessage, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const words = firstMessage.split(/\s+/).slice(0, 6).join(' ');
  return `${date}-${slugify(words)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function saveConversation(vaultPath, convo) {
  const folder = path.join(vaultPath, 'conversations', safeSegment(convo.id));
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'conversation.md'), serializeConversation(convo));
}

// ---------- paths ----------

function safeSegment(seg) {
  if (!seg || seg.includes('/') || seg.includes('\\') || seg.startsWith('.')) {
    throw new Error(`Invalid name: ${seg}`);
  }
  return seg;
}

// Resolve a vault-relative path, refusing anything that escapes the vault.
export function resolveInVault(vaultPath, rel) {
  const root = fs.realpathSync(vaultPath);
  const abs = path.resolve(root, rel);
  const real = fs.existsSync(abs) ? fs.realpathSync(abs) : abs;
  if (real !== root && !real.startsWith(root + path.sep)) {
    throw new Error(`Path escapes vault: ${rel}`);
  }
  return real;
}
