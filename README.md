# XBot Framework

A framework for building X/Twitter bots powered by Grok AI with function calling.

Build conversational bots that can understand natural language and take actions through custom plugins.

## Features

- **Grok AI Integration**: Uses xAI's Grok model for intelligent conversation understanding
- **Function Calling**: Grok can call your custom tools/APIs based on conversation context
- **Plugin Architecture**: Easily create custom bots for any use case
- **Real-time Streaming**: Monitors X mentions in real-time via filtered stream
- **Conversation Context**: Fetches full conversation threads for context-aware responses
- **Link Previews**: Generates shareable URLs with OG images for rich previews

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - X API credentials (required)
# - Grok API key (required)
# - Plugin-specific config

# Build and run
npm run build
npm start
```

## Project Structure

```
src/
├── index.ts                    # Entry point
├── bot.ts                      # Core bot orchestration
├── config.ts                   # Configuration
├── types.ts                    # Core types
│
├── framework/                  # XBot Framework
│   ├── index.ts               # Framework exports
│   ├── types.ts               # Plugin interface & types
│   ├── grok-client.ts         # Grok AI client
│   └── plugin-manager.ts      # Plugin lifecycle management
│
├── plugins/                    # Bot plugins
│   ├── index.ts               # Plugin registry
│   └── expedia/               # Example: Travel bot
│       └── index.ts           # Expedia plugin implementation
│
├── services/                   # Core services
│   ├── x-client.ts            # X API client
│   ├── filtered-stream.ts     # Real-time stream handler
│   ├── conversation.ts        # Thread fetching
│   ├── reply.ts               # Tweet replies
│   └── expedia/               # Expedia API client
│
web/                            # Website (Next.js)
├── app/
│   ├── r/[id]/page.tsx        # Recommendation display
│   └── api/                   # API routes
└── lib/                       # Shared utilities
```

## Creating a Custom Plugin

### 1. Define Your Plugin

Create a new file in `src/plugins/your-plugin/index.ts`:

```typescript
import { BotPlugin, ToolContext, ToolResult, Tool } from '../../framework/types';

export const myPlugin: BotPlugin = {
  id: 'my-plugin',
  name: 'My Custom Bot',
  description: 'A bot that does amazing things',
  version: '1.0.0',

  // Define the bot's personality and behavior
  systemPrompt: `You are a helpful assistant that...
  
  You have two modes:
  1. CONVERSATIONAL: Answer questions without using tools
  2. ACTION: When users want to do something specific, use the available tools
  
  Keep responses under 200 characters when using tools (a link will be appended).
  Keep responses under 280 characters for conversation.`,

  // Define tools Grok can use
  tools: [
    {
      type: 'function',
      function: {
        name: 'search_products',
        description: 'Search for products in the catalog',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            category: {
              type: 'string',
              description: 'Product category',
              enum: ['electronics', 'clothing', 'home'],
            },
          },
          required: ['query'],
        },
      },
    },
  ],

  // Initialize plugin (setup API clients, etc.)
  async initialize(config) {
    console.log('Initializing my plugin...');
    // Setup your API clients here
  },

  // Handle tool execution
  async executeTool(context: ToolContext): Promise<ToolResult> {
    const { toolName, arguments: args } = context;

    switch (toolName) {
      case 'search_products':
        // Call your API
        const results = await myApi.search(args.query, args.category);
        return {
          success: true,
          data: results,
        };

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  },

  // Extract data for website storage (optional)
  extractStorableData(toolResults) {
    // Return data to be stored and linked in tweets
    return {
      title: 'Product Results',
      primaryItem: {
        name: 'Product Name',
        price: '$99.99',
      },
      actionUrl: 'https://example.com/product/123',
    };
  },
};

export default myPlugin;
```

### 2. Register Your Plugin

Add it to `src/plugins/index.ts`:

```typescript
import { myPlugin } from './my-plugin';

export const availablePlugins: BotPlugin[] = [
  expediaPlugin,
  myPlugin,  // Add your plugin
];
```

### 3. Configure

Set `BOT_PLUGIN=my-plugin` in your `.env` file.

## Plugin Interface

```typescript
interface BotPlugin {
  // Identification
  id: string;
  name: string;
  description: string;
  version: string;

  // Grok configuration
  systemPrompt: string;        // Bot personality & rules
  tools: Tool[];               // Available function calls

  // Lifecycle
  initialize(config): Promise<void>;
  executeTool(context): Promise<ToolResult>;

  // Optional
  formatResponse?(message, results): Promise<BotResponse>;
  extractStorableData?(results): StorableData | null;
  shutdown?(): Promise<void>;
}
```

## Example Plugins Ideas

- **E-commerce Bot**: Search products, check prices, find deals
- **Customer Support Bot**: Answer FAQs, create tickets, check order status
- **Restaurant Bot**: Search restaurants, make reservations, view menus
- **Event Bot**: Find events, buy tickets, get venue info
- **Real Estate Bot**: Search listings, schedule viewings, get price estimates
- **Fitness Bot**: Find classes, book sessions, track workouts
- **News Bot**: Search articles, get summaries, find trending topics

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `X_BEARER_TOKEN` | Yes | X API Bearer Token |
| `X_API_KEY` | Yes | X API Key |
| `X_API_SECRET` | Yes | X API Secret |
| `X_ACCESS_TOKEN` | Yes | X Access Token |
| `X_ACCESS_TOKEN_SECRET` | Yes | X Access Token Secret |
| `GROK_API_KEY` | Yes | xAI Grok API Key |
| `BOT_USERNAME` | Yes | Your bot's X username |
| `WEBSITE_URL` | Yes | URL for link previews |
| `BOT_PLUGIN` | No | Plugin to use (default: expedia) |
| `PLUGIN_SANDBOX_MODE` | No | Use sandbox mode (default: true) |

## Deployment

### Bot (Requires Long-Running Process)

Deploy to Railway, Render, or any VPS:

```bash
npm install
npm run build
npm start
```

### Website (Vercel)

1. Push to GitHub
2. Import in Vercel with root directory set to `web`
3. Add environment variables
4. Deploy

## API Reference

### Grok Function Calling

Tools follow the OpenAI function calling format:

```typescript
{
  type: 'function',
  function: {
    name: 'tool_name',
    description: 'What this tool does',
    parameters: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: '...' },
        param2: { type: 'number', description: '...' },
      },
      required: ['param1'],
    },
  },
}
```

### Tool Results

```typescript
interface ToolResult {
  success: boolean;
  data?: unknown;    // Data to return to Grok
  error?: string;    // Error message if failed
}
```

### Bot Response

```typescript
interface BotResponse {
  message: string;      // Tweet text
  hasData: boolean;     // Whether to include a link
  data?: StorableData;  // Data for website storage
  directUrl?: string;   // Direct link (no storage)
}
```

## License

MIT
