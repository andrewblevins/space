# SPACE Terminal

[SPACE Terminal](https://spaceterminal.xyz) is an open-source interface for exploring complex problems with AI through multi-perspective conversations, iterative self-improvement, and user-defined alignment.

SPACE stands for Simple Perspective-Augmenting Conversation Environment (or, Simulated People Advising Convincingly Enough).

<img src="screenshots/terminal-screenshot.png" alt="SPACE Terminal Interface" width="800"/>

## What SPACE Does

Traditional AI chat systems impose hidden biases and limitations on users. SPACE attempts to flip this relationship. You define where the AI can improve, and the AI adapts to meet your standards.

The interface invites you to create and "grow" AI advisors with distinct perspectives, swap them out freely as the conversation evolves, and improve them iteratively through the embedded Evaluation system.

The result is a fluid, modular, deliberately developmental environment that aims to give you as much sovereignty as possible in the ongoing process of shaping the AI's perspectives.

## Key Features

- Create and manage AI advisors with distinct personalities
- Define quality criteria ("assertions") for responses
- Automatically optimize advisor responses through improve-and-test loops
- High Council mode: Have multiple advisors debate complex topics
- Export conversations and manage sessions
- See exactly what's sent to AI models in Debug mode
  
## Why SPACE Exists

LLM conversations are a mind-altering technology. For those who choose to engage with them, the current default interfaces offered by frontier AI companies a) hide significant choices from the user, b) prioritize hegemonic default perspectives, and c) implicitly nudge users to behave as passive receivers of an endlessly generating flood of information and ideas.

SPACE implements three core principles to redirect these tendencies:

- **Transparent Alignment**: See exactly how AI advisors are instructed and iteratively modify them to meet your needs.
- **Opponent Processing**: Use multiple perspectives to stress-test ideas and avoid spirals of confirmation bias.
- **User Sovereignty**: Where most apps track usage patterns and use them to optimize for engagement, SPACE gives users the power to define what constitutes improvement, and repeatedly invites an attitude of responsibility and curiosity toward the shaping of cognitive tools.

## Two Ways to Use SPACE

### Hosted Service
Visit [spaceterminal.xyz](https://spaceterminal.xyz) and sign in with Google. No setup required.

### Self-Hosted
Clone this repository and run your own instance:

```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cp .env.example .env
cp wrangler.toml.example wrangler.toml
# Add your API keys to wrangler.toml
npm run dev:watch
```

See [SETUP.md](SETUP.md) for detailed instructions.

## How the Evaluation System Works

1. Have a conversation with an advisor
2. Create assertions that define good responses by clicking the Assert button next to an advisor response
3. Run the optimization process (10 iterations of testing and improvement)
4. Accept or reject the optimized advisor

The system uses one AI model (Gemini) to suggest improvements and another (Claude) to test them against your criteria.

## Getting Started

### Hosted Version
1. Visit [spaceterminal.xyz](https://spaceterminal.xyz)
2. Sign in with Google
3. Add an advisor using the + button
4. Start a conversation

### Self-Hosted Version
1. Follow [SETUP.md](SETUP.md) to install dependencies
2. Add API keys for Anthropic, OpenAI, and Google
3. Run `npm run dev:watch`
4. Open `http://localhost:3000`

## Technical Details

Built with React, Cloudflare Workers, and Supabase. Uses Claude 4 Sonnet, GPT-4o, and Gemini Pro.

The evaluation system creates isolated test environments to avoid interfering with your main conversations.

## Documentation

- [SETUP.md](SETUP.md) - Installation and setup
- [docs/EVALUATION-SYSTEM.md](docs/EVALUATION-SYSTEM.md) - How the evaluation system works
- [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md) - Security measures
- [docs/](docs/) - Additional documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [SETUP.md](SETUP.md) for development setup.

## Potential Use Cases

- **Academic Research**: Create a panel with your field's leading theorist, a methodologist, and a constructive critic to pressure-test arguments from multiple angles
  
- **Creative Writing**: Assemble different editorial voices—a first reader, a mentor, an agent—switching between them as your manuscript develops
  
- **Business Strategy**: Build advisors representing different frameworks (Porter's Five Forces analyst, Blue Ocean strategist, Jobs-to-be-Done practitioner) to examine decisions through tested frames
  
- **Personal Decisions**: Design advisors who embody different aspects of wisdom—your future self, a teacher in your preferred lineage, a devil's advocate—to explore life choices seriously

## Support

- [GitHub Issues](https://github.com/andrewblevins/space/issues) for bugs
- [GitHub Discussions](https://github.com/andrewblevins/space/discussions) for questions
- andrew.s.blevins@gmail.com for direct contact

## Getting Involved

- **Try it**: Visit [spaceterminal.xyz](https://spaceterminal.xyz) or self-host
- **Share**: Create and share assertion templates for your field
- **Build**: Extend SPACE for your specific use case
- **Discuss**: Join our GitHub Discussions to shape the future of user-aligned AI

## License

MIT License - see [LICENSE](LICENSE) file.

Author: [Andrew Blevins](https://www.andrewshadeblevins.com)

Protocol by [Andrew Blevins](https://www.andrewshadeblevins.com) and [Jason Ganz](https://www.linkedin.com/in/jasnonaz/)

Much appreciation to [Varun Godbole](https://varungodbole.github.io/) for his help shaping this project, and for contributing the core insight behind user-directed evals.
