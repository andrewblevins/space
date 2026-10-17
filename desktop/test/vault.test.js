import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as vault from '../main/vault.js';
import { buildMessages, buildSystemPrompt } from '../main/providers.js';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'space-test-'));
const seed = path.join(import.meta.dirname, '..', 'seed');

test('new vault is seeded with advisors', () => {
  const v = tmp();
  vault.ensureVault(v, seed);
  const advisors = vault.listAdvisors(v);
  assert.equal(advisors.length, 4);
  assert.equal(advisors[0].id, 'the-steward');
  assert.match(advisors[0].prompt, /## What you hold to be true/);
  assert.equal(advisors[0].model, 'anthropic/claude-sonnet-5.5');
});

test('existing vault is never reseeded', () => {
  const v = tmp();
  fs.mkdirSync(path.join(v, 'advisors'), { recursive: true });
  vault.ensureVault(v, seed);
  assert.equal(vault.listAdvisors(v).length, 0);
});

test('conversation round-trips, including headings and quotes inside responses', () => {
  const v = tmp();
  vault.ensureVault(v);
  const convo = {
    id: '2026-10-15-test-abcd',
    title: 'A "quoted" title',
    created: '2026-10-15T12:00:00.000Z',
    rounds: [
      {
        user: 'Should I?',
        responses: [
          { advisorId: 'a', name: 'The A', model: 'anthropic/claude-opus-5.5', text: '## Not a turn\n\nBody' },
          { advisorId: 'b', name: 'The B', model: 'openai/gpt-6-astra', text: '', error: 'He said "no"' },
        ],
      },
      { user: 'Second', responses: [{ advisorId: 'a', name: 'The A', model: 'anthropic/claude-opus-5.5', text: 'ok' }] },
    ],
  };
  vault.saveConversation(v, convo);
  assert.deepEqual(vault.loadConversation(v, convo.id), convo);
  assert.equal(vault.listConversations(v)[0].title, 'A "quoted" title');
});

test('createAdvisor avoids collisions and writes a template', () => {
  const v = tmp();
  vault.ensureVault(v);
  assert.equal(vault.createAdvisor(v, 'The Poet'), 'advisors/the-poet/advisor.md');
  assert.equal(vault.createAdvisor(v, 'The Poet'), 'advisors/the-poet-2/advisor.md');
  assert.equal(vault.readAdvisor(v, 'the-poet').name, 'The Poet');
});

test('resolveInVault refuses escapes', () => {
  const v = tmp();
  assert.throws(() => vault.resolveInVault(v, '../etc/passwd'));
  assert.throws(() => vault.loadConversation(v, '../x'));
});

test('sources are appended to the system prompt', () => {
  const v = tmp();
  vault.ensureVault(v, seed);
  fs.writeFileSync(path.join(v, 'advisors/the-steward/sources/burke.md'), 'Society is a partnership...');
  const a = vault.readAdvisor(v, 'the-steward');
  const sys = buildSystemPrompt(a, vault.readAdvisorSources(v, a), new Date(2026, 9, 15));
  assert.match(sys, /# The Steward/);
  assert.match(sys, /## burke.md\n\nSociety is a partnership/);
  assert.match(sys, /Today is Thursday, October 15, 2026\.$/);
});

test('each advisor sees its own replies and the others from the previous round', () => {
  const rounds = [
    {
      user: 'Q1',
      responses: [
        { advisorId: 'a', name: 'A', text: 'a1' },
        { advisorId: 'b', name: 'B', text: 'b1' },
      ],
    },
  ];
  const msgs = buildMessages(rounds, 'a', 'Q2');
  assert.deepEqual(msgs.map((m) => m.role), ['user', 'assistant', 'user']);
  assert.equal(msgs[1].content, 'a1');
  assert.match(msgs[2].content, /\*\*B:\*\* b1/);
  assert.doesNotMatch(msgs[2].content, /\*\*A:\*\*/);
  assert.match(msgs[2].content, /Q2$/);
});

test('advisor absent from a round still yields alternating roles', () => {
  const rounds = [{ user: 'Q1', responses: [{ advisorId: 'b', name: 'B', text: 'b1' }] }];
  const msgs = buildMessages(rounds, 'a', 'Q2');
  assert.deepEqual(msgs.map((m) => m.role), ['user', 'assistant', 'user']);
});

test('setAdvisorModel changes only the model line', () => {
  const v = tmp();
  vault.ensureVault(v, seed);
  const file = path.join(v, 'advisors/the-steward/advisor.md');
  const before = fs.readFileSync(file, 'utf8');
  vault.setAdvisorModel(v, 'the-steward', 'deepseek/deepseek-v4-pro-0813');
  const after = fs.readFileSync(file, 'utf8');
  assert.equal(after, before.replace('model: anthropic/claude-sonnet-5.5', 'model: deepseek/deepseek-v4-pro-0813'));
  assert.equal(vault.readAdvisor(v, 'the-steward').model, 'deepseek/deepseek-v4-pro-0813');
});

test('setAdvisorModel adds a model line when missing', () => {
  const v = tmp();
  vault.ensureVault(v);
  fs.mkdirSync(path.join(v, 'advisors/x'));
  fs.writeFileSync(path.join(v, 'advisors/x/advisor.md'), '---\nname: X\n---\n\nBody');
  vault.setAdvisorModel(v, 'x', 'meta/muse-spark-1.3');
  assert.equal(vault.readAdvisor(v, 'x').model, 'meta/muse-spark-1.3');
  assert.equal(vault.readAdvisor(v, 'x').prompt, 'Body');
});

test('conversation round-trip keeps per-reply cost', () => {
  const convo = {
    id: 'c',
    title: 'Costs',
    created: '2026-10-17T00:00:00.000Z',
    rounds: [{ user: 'hi', responses: [
      { advisorId: 'a', model: 'm', name: 'A', text: 'yo', cost: 0.0012345 },
      { advisorId: 'b', model: 'm', name: 'B', text: '', error: 'Stopped.' },
    ] }],
  };
  const back = vault.parseConversation("c", vault.serializeConversation(convo));
  assert.equal(back.rounds[0].responses[0].cost, 0.0012345);
  assert.equal(back.rounds[0].responses[1].cost, undefined);
});
