// The models offered in the advisor picker, all mid-tier ("Sonnet-class") from
// each maker. Any OpenRouter model id still works if typed into advisor.md;
// this list is just the menu. Shared by the main process and the UI.

export const MODEL_OPTIONS = [
  { id: 'anthropic/claude-sonnet-5.5', label: 'Claude', name: 'Claude Sonnet 5.5' },
  { id: 'openai/gpt-6.1-sol', label: 'GPT', name: 'GPT-6.1 Sol' },
  // Reasoning can't be turned off for Muse; "low" keeps first words to ~10s instead of ~30s.
  { id: 'meta/muse-spark-1.3', label: 'Muse', name: 'Meta Muse Spark 1.3', reasoning: { effort: 'low' } },
  { id: 'deepseek/deepseek-v4-pro-0813', label: 'DeepSeek', name: 'DeepSeek V4 Pro' },
];

export const DEFAULT_MODEL = MODEL_OPTIONS[0].id;

const MAKERS = {
  anthropic: 'Claude',
  openai: 'GPT',
  meta: 'Muse',
  'meta-llama': 'Llama',
  google: 'Gemini',
  'x-ai': 'Grok',
  deepseek: 'DeepSeek',
  mistralai: 'Mistral',
};

// Short tag for the panel: anthropic/claude-sonnet-5.5 -> Claude.
export function modelLabel(model) {
  if (!model) return '';
  const known = MODEL_OPTIONS.find((m) => m.id === model);
  if (known) return known.label;
  const [maker, name = maker] = model.split('/');
  return MAKERS[maker] || name.split(/[-:]/)[0];
}
