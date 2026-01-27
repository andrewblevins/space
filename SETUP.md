# SPACE Terminal Setup Guide

## Quick Start

SPACE Terminal is an open-source interface for exploring complex questions through multi-perspective AI conversations. This guide will help you get it running locally.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git**

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/andrewblevins/space.git
   cd space
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the environment template
   cp .env.example .env
   cp wrangler.toml.example wrangler.toml
   ```

4. **Set up API keys** (see API Keys section below)

5. **Start development server**
   ```bash
   npm run dev:watch
   ```

   This runs both the frontend (Vite) and backend (Wrangler) simultaneously.

6. **Open your browser**
   Navigate to `http://localhost:3000`

## API Keys Setup

You'll need API keys from these providers:

### Required APIs
- **Anthropic (Claude)**: Get from [console.anthropic.com](https://console.anthropic.com)
- **OpenAI (GPT)**: Get from [platform.openai.com](https://platform.openai.com)

### Configuration Files

**`.env`** (for frontend):
```env
VITE_USE_AUTH=false
```

**`wrangler.toml`** (for backend functions):
```toml
[vars]
ANTHROPIC_API_KEY = "sk-ant-api03-your-anthropic-key"
OPENAI_API_KEY = "sk-proj-your-openai-key"
```

## Data Storage

All conversation data is stored locally in your browser's localStorage. No database or cloud storage is used. This means:
- Your conversations stay on your device
- Data persists until you clear your browser data
- No account or sign-in required

## Key Features to Test

1. **Journal Onboarding**: Go through the context-gathering flow and let the system suggest relevant perspectives
2. **Parallel Perspectives**: See multiple perspectives respond simultaneously in the grid layout
3. **Perspective Fluidity**: Generate new perspectives, swap them out, or create your own mid-conversation
4. **Session Management**: Save and load conversation sessions

## Architecture Overview

```
src/
├── components/          # React components
│   ├── terminal/       # Terminal interface components
│   └── modals/         # Modal dialogs
├── hooks/              # Custom React hooks for API calls
├── utils/              # Utility functions
└── contexts/           # React contexts

functions/              # Cloudflare Workers backend
├── api/               # API endpoints
└── utils/             # Backend utilities
```

## Common Issues

### Port Conflicts
If port 3000 is in use:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9
```

### API Key Issues
- Make sure keys are in `wrangler.toml` (not just `.env`)
- Restart dev server after changing API keys
- Check browser console for specific error messages

### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## Security Notes

- Never commit API keys to version control
- Use `.env` and `wrangler.toml` for secrets (both are gitignored)
- The example files show the structure but contain no real credentials

## Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Open GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## License

This project is licensed under the MIT License - see the LICENSE file for details. 