# SPACE Terminal

[SPACE Terminal](https://spaceterminal.xyz) is an AI advisor system that lets you define quality criteria and optimize responses automatically. Available as a hosted service and open source for self-hosting.

SPACE stands for Simple Perspective-Augmenting Conversation Environment.

<img src="screenshots/terminal-screenshot.png" alt="SPACE Terminal Interface" width="800"/>

## What SPACE Does

SPACE lets you create AI advisors with different perspectives and have conversations with them. You can define what makes a good response and let the system improve advisor quality through iterative testing.

The key difference from other chat interfaces is the evaluation system: you set the standards, and SPACE optimizes responses to meet them. This puts you in control of AI behavior rather than accepting whatever the model provides.

## Key Features

- Create and manage AI advisors with distinct personalities
- Define quality criteria ("assertions") for responses
- Automatically optimize advisor responses through testing loops
- Have multiple advisors debate complex topics
- Export conversations and manage sessions
- See exactly what's sent to AI models with cost estimates

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
2. Create assertions that define good responses
3. Run the optimization process (10 iterations of testing and improvement)
4. Accept or reject the optimized advisor

The system uses one AI model (Gemini) to suggest improvements and another (Claude) to test them against your criteria. You control the final decision.

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

## Use Cases

- Academic research with quality-controlled AI responses
- Creative collaboration with diverse AI perspectives
- Business analysis from multiple angles
- Personal exploration of complex topics

## Support

- [GitHub Issues](https://github.com/andrewblevins/space/issues) for bugs
- [GitHub Discussions](https://github.com/andrewblevins/space/discussions) for questions
- andrew.s.blevins@gmail.com for direct contact

## License

MIT License - see [LICENSE](LICENSE) file.

Author: [Andrew Shade Blevins](https://www.andrewshadeblevins.com)
