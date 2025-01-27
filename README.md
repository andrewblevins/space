# SPACE Terminal

SPACE Terminal is an experimental terminal-style interface for personal discovery and thinking with large language models. SPACE stands for Simple Perspective-Augmenting Conversation Environment (or maybe, Simulated People Advising Convincingly Enough).

The biggest difference from other chat interfaces is the ability to create and manage AI personas with distinct perspectives, changing them out mid-conversation. For more about AI advisors, see the Insight Cascade process and guidelines here: https://github.com/andrewblevins/insight-cascade. 

SPACE also lets you have much longer conversations without hitting rate limits, a current limitation of Claude Pro.

The app uses Claude 3.5 Sonnet for the main conversation and GPT-4o for background analysis features like metaphor tracking and question generation (which you can activate by clicking the triangles next to those menus). Model selection is not configurable through the interface yet, if anyone wants to implement that I'd be very grateful.

Currently SPACE will only work well on a desktop or laptop computer. Mobile layout TK.

*SPACE is one node in a larger project exploring frameworks and interfaces for using Large Language Models for personal and social discovery. If you're interested in being a part of a commmunity supporting ongoing dialogue and experimentation around this, sign up for updates here: https://forms.gle/svMNnjJjJdFUjQ9L8.*

## Setup

SPACE Terminal requires API keys from both Anthropic and OpenAI to function. You'll be prompted to insert them when you first run the app.

You'll also need to add some money to both accounts, or set up payment methods. For more on this, see [Cost Expectations](#cost-expectations) below. 

### 1. Get Your API Keys

#### Anthropic (Claude)
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to "API Keys" in your account settings
4. Create a new API key and copy it

#### OpenAI
1. Visit [platform.openai.com](https://platform.openai.com/)
2. Sign up or log in
3. Go to "API Keys" in your account settings
4. Create a new API key and copy it

### Once that's done, to start playing

Add your first advisor by clicking the + button on the left side of the screen. Type in a name and click "Generate Description" to get a personality, edit to your liking, then click "Create". 

Make sure the advisors you want to talk to are green (selected).

When you have a board of advisors you like, enter:

> /prompt use "serious-play"

This will send a basic starting prompt for the conversation.

## Features

- **Terminal-Style Interface**: Clean, focused environment for conversation

- **Advisor System**: Create, manage, and generate descriptions for AI personas for varied perspectives

- **Column Layout**: 
  - Left: Metaphor tracking and advisor menu
  - Center: Main conversation area
  - Right: Generated questions for exploration

- **Context Management**: Set token limit beyond which conversation history is shortened (to save tokens/$$$). Past this limit, the LLM will receive the six most recent messages and any messages deemed relevant according to...

- **Tag Analysis**: Background analysis and tracking of conversation themes (currently only used for context management but will be expanded and deepened)

- **Export**: Save your conversation in markdown format

- **Prompts Library**: A library of prompts you can add to, edit, and delete. Also includes a handful of default suggestions

- **Capture**: Right click selected text to capture and save to a Markdown file

- **Debug**: Activate `/debug` to see what's being sent to Claude as well as the estimated cost of each message.

## Available Commands

Enter `/help` anytime to see this list of commands in the terminal.

### Session Management
- `/new` - Start a new session
- `/sessions` - List all sessions and their numbers
- `/load <id>` - Load a specific session (id = session number)
- `/load previous` - Load the most recent session

### Advisor Management
- `/advisor` - Show available advisor commands
- `/advisor add` - Add a new advisor
- `/advisor edit` - Edit an advisor
- `/advisor remove` - Remove an advisor
- `/advisor list` - List all advisors

### Group Management
- `/group create <group_name>` - Create a new advisor group (e.g. `/group create Psychologists`)
- `/group add <group_name> <advisor>` - Add an advisor to a group (e.g. `/group add Psychologists Carl Jung`)
- `/group remove <group_name> <advisor>` - Remove an advisor from a group
- `/group list` - List all advisor groups and their members

### Save and Use Prompts
- `/prompt add "name" <text>` - Save a new prompt
- `/prompt list` - Show all saved prompts
- `/prompt use "name"` - Use a saved prompt
- `/prompt edit "name"` - Edit an existing prompt
- `/prompt delete "name"` - Delete a saved prompt

### Settings
- `/context limit <number>` - Set token limit for context management (default: 150,000)
- `/response length <number>` - Set maximum length for Claude responses (default: 4,096, max: 8,192)

## Roadmap

- [ ] Worksheet system for reflection and advisor finding
- [ ] Model selection and configuration 
- [ ] Better memory / context management system
- [ ] More conversation analysis tools (interpersonal patterns, Kegan stages, etc.?)
- [ ] Ways to share advisors with your friends

## Cost Expectations

SPACE Terminal is very cost-effective to use. For instance, an hour-long deep discussion may run about $0.25-30 (possibly up to a dollar if you send messages very fast). Each message exchange (your message + AI response) costs roughly 2¢ on average. Starting with $5 in each API account will easily give you several hours of conversation. Use the '/debug' command to monitor estimated costs in real-time.

## How to Help

I would love for folks to build on this with me. Fork the repo, make the changes you want to see, and submit a pull request when ready.

If you've found a bug or have an idea for a feature, report here:
- [Bugs](https://github.com/andrewblevins/space/issues/new)
- [Feature Requests](https://github.com/andrewblevins/space/issues/new?labels=enhancement&template=feature_request.md)

Or talk to me at andrew.s.blevins@gmail.com / [@andrew0blevins](https://x.com/andrew0blevins) on Twitter.

## License

MIT

Author: [Andrew Shade Blevins](www.andrewshadeblevins.com)

## Acknowledgments

SPACE Terminal would not be possible without the generous support of the Context Appreciation Society. 
