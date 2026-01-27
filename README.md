# SPACE Terminal

[SPACE Terminal](https://spaceterminal.xyz) is a free, open-source interface for exploring complex questions through multi-perspective AI conversations.

SPACE stands for Simple Perspective-Augmenting Chat Environment (or, Simulated People Aspecting Convincingly Enough).

<img src="screenshots/terminal-screenshot.png" alt="SPACE Terminal Interface" width="800"/>

## Quick Start

**SPACE uses your own API key.** You'll need an [OpenRouter](https://openrouter.ai) account.

1. Visit [spaceterminal.xyz](https://spaceterminal.xyz)
2. Get an API key from [openrouter.ai/keys](https://openrouter.ai/keys)
3. Paste your key and start exploring

Your conversations are stored locally in your browser—we don't store your data on our servers.

## What SPACE Does

Standard AI chat interfaces give you one voice: authoritative, fluid, and singular. SPACE gives you many. Each response from the user generates a multiplicity of simultaneous responses from the AI, each from a distinct perspective. The result is a fundamentally different kind of conversation—one that requires active participation rather than passive reception.

A brief onboarding flow helps you surface what's actually on your mind before the conversation begins. The system then suggests relevant perspectives from four categories: simulated actual humans, mythic figures, role-based entities, and challengers designed to question your implicit assumptions. You can use the suggestions, modify them, or write your own from scratch. You can swap perspectives freely as the conversation evolves—the experience is designed to feel more like a laboratory than a fixed panel.

SPACE grew out of [Insight Cascade](https://medium.com/@jasnonaz), a protocol co-created with Jason Ganz in late 2024 and introduced through a series of workshops at the Fractal Tech Hub in Brooklyn.

## Why Multiple Perspectives

The media theorist Marshall McLuhan distinguished between "hot" and "cool" media. A hot medium delivers high-definition information to a single sense—your role is to receive. A cool medium is low-definition; it requires participation to fill in what's missing.

A standard AI chat interface is hot. A multi-perspective interface is cooler. When you're presented with several different framings of your situation, none of them complete, you have to do something with them—compare, weigh, integrate, reject. The temperature drops, and participation rises.

This matters beyond aesthetics. One voice, always available, optimized to be helpful, can train a kind of passivity—the expectation that there is an answer, that someone will provide it. It can also enable confirmation bias spirals, where user and system arrive at a shared frame and stay there, each reinforcing the other. Multiple voices push against both tendencies. They restore the kind of friction that produces insight.

## Key Features

- **Parallel Multi-Perspective Conversations**: Perspectives respond simultaneously, displayed in a responsive grid for direct comparison
- **Journal Onboarding**: A context-gathering flow that asks follow-up questions before generating relevant perspectives—surfacing assumptions that might otherwise stay implicit
- **Perspective Fluidity**: Generate, swap, modify, and create perspectives at any point in the conversation
- **Full Transparency**: See exactly what's sent to AI models in Debug mode—no hidden system prompts
- **Privacy-First**: All data stored locally in your browser. No accounts required, no server-side storage
- **Session Management**: Save conversations, reference past sessions with @-mentions, and maintain continuity across explorations

## Use Cases

- **Complex decisions**: Assemble perspectives representing different stakeholders, frameworks, or values to see a situation from angles you hadn't considered

- **Getting unstuck**: When you're cycling through the same thoughts, genuinely different framings can create movement where sympathy alone cannot

- **Philosophical inquiry**: Engage multiple wisdom traditions or intellectual approaches with the same question and see where they converge and diverge

- **Creative exploration**: Use the collision of perspectives to generate possibilities that wouldn't emerge from a single voice

- **Adversarial reflection**: Push back against the perspectives, correct their framings—the act of engaging with external viewpoints, even simulated ones, can be activating and clarifying in itself

## Bring Your Own Key (BYOK)

SPACE is free to use, but you bring your own API key. This means:

- **You control costs**: Pay only for what you use
- **No subscriptions**: No monthly fees to us—just pay-as-you-go to OpenRouter
- **Privacy**: Your API key is stored encrypted in your browser, never on our servers
- **Model access**: OpenRouter provides access to Claude, GPT, Gemini, and more through a single key

## Self-Hosting

Clone the repository and run your own instance:

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cp .env.example .env
cp wrangler.toml.example wrangler.toml
npm run dev:watch
```

See [SETUP.md](SETUP.md) for detailed instructions.

## Technical Details

Built with React, Vite, TailwindCSS, and Cloudflare Pages. Uses Claude (via OpenRouter) as the primary model.

All conversation data is stored in your browser's localStorage. No database or cloud storage is used.

## Documentation

- [SETUP.md](SETUP.md) - Installation and setup
- [docs/](docs/) - Additional documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [SETUP.md](SETUP.md) for development setup.

## Support

- [GitHub Issues](https://github.com/andrewblevins/space/issues) for bugs
- [GitHub Discussions](https://github.com/andrewblevins/space/discussions) for questions
- andrew.s.blevins@gmail.com for direct contact

## Acknowledgments

This project wouldn't exist without Jason Ganz, who co-created the original Insight Cascade protocol, and Varun Godbole, whose coaching and insight shaped its development. Thanks to the HCI Club for playtesting and support, Fractal Tech for providing the physical environment, and the Cosmos Institute for the FIRE grant that made the final push possible.

## License

MIT License - see [LICENSE](LICENSE) file.

Author: [Andrew Blevins](https://www.andrewshadeblevins.com)

Protocol by [Andrew Blevins](https://www.andrewshadeblevins.com) and [Jason Ganz](https://www.linkedin.com/in/jasnonaz/)
