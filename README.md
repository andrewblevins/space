# SPACE Terminal

[SPACE Terminal](https://spaceterminal.xyz) is a free, open-source interface for exploring complex problems with AI through multi-perspective conversations, iterative self-improvement, and user-defined alignment.

SPACE stands for Simple Perspective-Augmenting Conversation Environment (or, Simulated People Advising Convincingly Enough).

<img src="screenshots/terminal-screenshot.png" alt="SPACE Terminal Interface" width="800"/>

## Quick Start

**SPACE uses your own API key.** You'll need an [OpenRouter](https://openrouter.ai) account (free tier available).

1. Visit [spaceterminal.xyz](https://spaceterminal.xyz)
2. Get an API key from [openrouter.ai/keys](https://openrouter.ai/keys) (takes 2 minutes)
3. Paste your key and start exploring

Your conversations are stored locally in your browser—we don't store your data on our servers.

## What SPACE Does

Traditional AI chat systems impose hidden biases and limitations on users. SPACE attempts to flip this relationship. You define where the AI can improve, and the AI adapts to meet your standards.

The interface invites you to create and "grow" AI advisors with distinct perspectives, swap them out freely as the conversation evolves, and improve them iteratively through the embedded Evaluation system.

The result is a fluid, modular, deliberately developmental environment that aims to give you as much sovereignty as possible in the ongoing process of shaping the AI's perspectives.

## Key Features

- **Multi-Perspective Conversations**: Create and manage AI advisors with distinct personalities that respond simultaneously in parallel
- **Quality Criteria System**: Define assertions for responses and iteratively optimize advisors through improve-and-test loops
- **Knowledge Dossier**: Track conversation history, search past sessions, and build interconnected knowledge over time
- **Journal Onboarding**: Smart context-gathering flow that asks follow-up questions before generating relevant perspectives
- **Session Management**: Export conversations, reference past sessions with @-mentions, and maintain conversation continuity
- **Full Transparency**: See exactly what's sent to AI models in Debug mode
- **Privacy-First**: All data stored locally in your browser—no accounts required, no server-side storage
  
## Why SPACE Exists

LLM conversations are a mind-altering technology. For those who choose to engage with them, the current default interfaces offered by frontier AI companies a) hide significant choices from the user, b) prioritize hegemonic default perspectives, and c) implicitly nudge users to behave as passive receivers of an endlessly generating flood of information and ideas.

SPACE implements three core principles to redirect these tendencies:

- **Transparent Alignment**: See exactly how AI advisors are instructed and iteratively modify them to meet your needs.
- **Opponent Processing**: Use multiple perspectives to stress-test ideas and avoid spirals of confirmation bias.
- **User Sovereignty**: Where most apps track usage patterns and use them to optimize for engagement, SPACE gives users the power to define what constitutes improvement, and repeatedly invites an attitude of responsibility and curiosity toward the shaping of cognitive tools.

## Bring Your Own Key (BYOK)

SPACE is free to use, but you bring your own API key. This means:

- **You control costs**: Pay only for what you use (typically $5-15/month for regular use)
- **No subscriptions**: No monthly fees to us—just pay-as-you-go to OpenRouter
- **Privacy**: Your API key is stored encrypted in your browser, never on our servers
- **Access to 200+ models**: OpenRouter provides access to Claude, GPT, Gemini, and more through a single key

**Why OpenRouter?** Instead of managing multiple API keys from different providers, OpenRouter gives you access to all major AI models with one key and one account.

## Self-Hosting

Want to run your own instance? Clone this repository:

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cp .env.example .env
cp wrangler.toml.example wrangler.toml
npm run dev:watch
```

See [SETUP.md](SETUP.md) for detailed instructions.

## How the Evaluation System Works

1. Have a conversation with an advisor
2. Create assertions that define good responses by clicking the Assert button next to an advisor response
3. Run the optimization process (10 iterations of testing and improvement)
4. Accept or reject the optimized advisor

The system uses one AI model (Gemini) to suggest improvements and another (Claude) to test them against your criteria.

## Potential Use Cases

- **Academic Research**: Create a panel with your field's leading theorist, a methodologist, and a constructive critic to pressure-test arguments from multiple angles
  
- **Creative Writing**: Assemble different editorial voices—a first reader, a mentor, an agent—switching between them as your manuscript develops
  
- **Business Strategy**: Build advisors representing different frameworks (Porter's Five Forces analyst, Blue Ocean strategist, Jobs-to-be-Done practitioner) to examine decisions through tested frames
  
- **Personal Decisions**: Design advisors who embody different aspects of wisdom—your future self, a teacher in your preferred lineage, a devil's advocate—to explore life choices seriously

## Technical Details

Built with React, Vite, TailwindCSS, and Cloudflare Pages. Uses Claude, GPT-4o, and Gemini via OpenRouter.

All conversation data is stored in your browser's localStorage. No database or cloud storage is used.

## Documentation

- [SETUP.md](SETUP.md) - Installation and setup
- [docs/EVALUATION-SYSTEM.md](docs/EVALUATION-SYSTEM.md) - How the evaluation system works
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

## License

MIT License - see [LICENSE](LICENSE) file.

Author: [Andrew Blevins](https://www.andrewshadeblevins.com)

Protocol by [Andrew Blevins](https://www.andrewshadeblevins.com) and [Jason Ganz](https://www.linkedin.com/in/jasnonaz/)

Much appreciation to [Varun Godbole](https://varungodbole.github.io/) for his help shaping this project, and for contributing the core insight behind user-directed evals.
