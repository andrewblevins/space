# SPACE Terminal

SPACE Terminal is an experimental interface for deep conversations with AI, designed to facilitate meaningful dialogue and personal exploration. Built with React and Vite, it provides a terminal-style interface with enhanced features for managing and enriching AI interactions.

## Features

- **Terminal-Style Interface**: Clean, focused environment for deep conversations
- **Multi-Column Layout**: 
  - Left: Metaphor tracking and advisor management
  - Center: Main conversation area
  - Right: Generated questions for deeper exploration
- **Memory System**: Maintains context across conversations and allows for searching past interactions
- **Advisor System**: Create and manage different AI personas for varied perspectives
- **Export Functionality**: Save conversations in markdown format

## Getting Started

1. Clone the repository
2. Install dependencies:

bash
npm install

3. Create a `.env` file with your API keys:

bash
VITE_ANTHROPIC_API_KEY=your_claude_api_key
VITE_OPENAI_API_KEY=your_openai_api_key

4. Run the development server:

bash
npm run dev


## Available Commands

- `/help` - Show all available commands
- `/export` - Export current session as markdown
- `/memory` - Access conversation memory functions
- `/worksheet` - Access worksheet templates (in development)
- `/tokens` - Adjust response length

## Roadmap

- [ ] Enhanced worksheet system for advisor generation
- [ ] Improved memory and context management
- [ ] Additional conversation analysis tools
- [ ] Extended advisor customization options

## License

MIT

## Author

Andrew Blevins