# SPACE Terminal

[SPACE Terminal](https://spaceterminal.xyz) is a revolutionary AI advisor system with **user-sovereign evaluation capabilities**. Available both as a hosted service and open source for self-hosting.

SPACE stands for Simple Perspective-Augmenting Conversation Environment (or maybe, Simulated People Advising Convincingly Enough).

<img src="screenshots/terminal-screenshot.png" alt="SPACE Terminal Interface" width="800"/>

## 🚀 What Makes SPACE Different

### Multi-Advisor Conversations
Create AI personas with distinct perspectives and have them debate complex topics. Switch advisors mid-conversation for varied viewpoints.

### **Revolutionary Evaluation System** 🔥
The breakthrough feature: **user-controlled AI optimization**. Define your own quality criteria ("assertions") and let SPACE automatically improve advisor responses through iterative testing. This is "democratic AI development" - you define what "good" looks like, not big tech companies.

### Terminal-Style Interface
Clean, focused environment designed for deep thinking and exploration.

## 🎯 Key Features

- **🤖 Multi-Advisor System**: Create, manage, and switch between AI personas
- **⚡ Evaluation Loop**: Define assertions and optimize advisor quality automatically  
- **🏛️ High Council Mode**: Get multiple perspectives debating complex topics
- **📊 Context Management**: Smart conversation summarization and memory
- **🏷️ Tag Analysis**: Automatic theme tracking and analysis
- **📝 Export System**: Save conversations in markdown format
- **💾 Session Management**: Save and load conversation sessions
- **🔍 Debug Mode**: See exactly what's sent to AI models with cost estimates

## 🌐 Two Ways to Use SPACE

### 1. **Hosted Service** (Easiest)
Visit [spaceterminal.xyz](https://spaceterminal.xyz) - sign in with Google and start immediately. No setup required.

### 2. **Self-Hosted** (Full Control)
Clone this repository and run your own instance with your API keys.

**Quick Start:**
```bash
git clone https://github.com/andrewblevins/space.git
cd space
npm install
cp .env.example .env
cp wrangler.toml.example wrangler.toml
# Add your API keys to wrangler.toml
npm run dev:watch
```

See [SETUP.md](SETUP.md) for detailed installation instructions.

## 🧠 The Evaluation System

SPACE's evaluation system is a breakthrough in AI alignment:

1. **Create Assertions**: Define what makes a good response (accuracy, creativity, etc.)
2. **Test Responses**: Evaluate advisor outputs against your criteria  
3. **Optimize Automatically**: 10-iteration improvement loop using Gemini + Claude
4. **Accept or Reject**: You control the final optimization results

This puts **you** in charge of AI alignment, not corporations. See [docs/EVALUATION-SYSTEM.md](docs/EVALUATION-SYSTEM.md) for details.

## 🚀 Getting Started

### Hosted Version
1. Visit [spaceterminal.xyz](https://spaceterminal.xyz)
2. Sign in with Google
3. Click + to add your first advisor
4. Start conversing!

### Self-Hosted Version
1. Follow the [SETUP.md](SETUP.md) guide
2. Add your API keys (Anthropic, OpenAI, Gemini)
3. Run `npm run dev:watch`
4. Open `http://localhost:3000`

## 🎮 Usage Tips

- **Add Advisors**: Click the + button, generate descriptions, customize personalities
- **Select Active Advisors**: Green = active, click to toggle
- **Try High Council**: Use multiple advisors for complex debates
- **Create Assertions**: Click "Evaluate" to set quality standards
- **Optimize Responses**: Let the system improve advisor quality automatically
- **Export Conversations**: Save your insights in markdown format

## 🏗️ Architecture

**Frontend**: React + Vite  
**Backend**: Cloudflare Workers  
**Database**: Supabase (optional)  
**AI Models**: Claude 4 Sonnet, GPT-4o, Gemini Pro  

## 🤝 Contributing

We welcome contributions! This project represents a new paradigm in human-AI interaction.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

See [SETUP.md](SETUP.md) for development setup.

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide
- **[docs/EVALUATION-SYSTEM.md](docs/EVALUATION-SYSTEM.md)** - Evaluation system deep dive
- **[docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)** - Security measures and audit
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Technical architecture
- **[docs/](docs/)** - Additional documentation

## 🔒 Privacy & Security

- **Self-Hosted**: Complete data control when running locally
- **Hosted Service**: Conversations processed by AI providers (review their data policies)
- **Open Source**: Full transparency - audit the code yourself
- **Local Storage**: Works offline with browser storage

## 💡 Use Cases

- **Academic Research**: Multi-perspective analysis with quality control
- **Creative Collaboration**: Brainstorm with diverse AI personalities  
- **Business Analysis**: Stress-test ideas from multiple angles
- **Personal Development**: Explore complex topics with tailored advisors
- **Truth-Seeking**: Democratic AI alignment for intellectual integrity

## 🌟 The Vision

SPACE Terminal is part of a larger project exploring frameworks for using AI for personal and social discovery. We're building tools that put humans in control of AI alignment and foster genuine intellectual growth.

Join our community: [Sign up for updates](https://forms.gle/svMNnjJjJdFUjQ9L8)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/andrewblevins/space/issues)
- **Discussions**: [GitHub Discussions](https://github.com/andrewblevins/space/discussions)
- **Email**: andrew.s.blevins@gmail.com
- **Twitter**: [@andrew0blevins](https://x.com/andrew0blevins)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Author**: [Andrew Shade Blevins](https://www.andrewshadeblevins.com)

## 🙏 Acknowledgments

SPACE Terminal would not be possible without the generous support of the Context Appreciation Society and the open source community.
