# PredictBot

An AI-powered X/Twitter bot that creates prediction markets from tweets using Grok.

When someone makes a claim like "I bet China won't invade Taiwan", anyone can reply mentioning @marketmake67808 to instantly create a tradeable prediction market.

## Features

- **Grok AI Integration** - Uses xAI's Grok model to understand context and frame predictions
- **Automatic Market Creation** - Extracts claims from tweets and creates YES/NO markets
- **Rich Link Previews** - Auto-generated OG images showing market probabilities
- **Real-time Streaming** - Monitors X mentions via filtered stream
- **Conversation Context** - Understands full thread context for accurate prediction framing

## How It Works

1. Someone tweets: "I bet the Fed won't cut rates this year"
2. Another user replies: "Hey @marketmake67808 create a market for this"
3. The bot creates a market: "Will the Fed cut rates by December 2026?"
4. Bot replies with a link showing 65% YES / 35% NO with a preview card

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/predictbot.git
cd predictbot

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see Configuration section)

# Build and run
npm run build
npm start
```

## Configuration

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `X_BEARER_TOKEN` | X API Bearer Token (for reading) |
| `X_API_KEY` | X API Key |
| `X_API_SECRET` | X API Secret |
| `X_ACCESS_TOKEN` | X Access Token (for posting) |
| `X_ACCESS_TOKEN_SECRET` | X Access Token Secret |
| `GROK_API_KEY` | xAI Grok API Key |
| `BOT_USERNAME` | Your bot's X username (default: marketmake67808) |
| `WEBSITE_URL` | Base URL for link previews |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_PLUGIN` | `prediction-market` | Which plugin to use |
| `PLUGIN_SANDBOX_MODE` | `true` | Use sandbox/mock data |

### Getting API Keys

1. **X/Twitter API**: Apply at [developer.twitter.com](https://developer.twitter.com)
   - Create a project with "Read and Write" permissions
   - Generate Bearer Token, API Key/Secret, Access Token/Secret

2. **Grok API**: Get access at [x.ai](https://x.ai)
   - Create an API key in the dashboard

---

## Deployment

The bot requires a **long-running process** (not serverless).

### Docker (Recommended)

```bash
# Build the image
docker build -t predictbot .

# Run with environment variables
docker run -d \
  -e X_API_KEY=your_key \
  -e X_API_SECRET=your_secret \
  -e X_BEARER_TOKEN=your_token \
  -e X_ACCESS_TOKEN=your_access_token \
  -e X_ACCESS_TOKEN_SECRET=your_access_secret \
  -e GROK_API_KEY=your_grok_key \
  -e BOT_USERNAME=marketmake67808 \
  -e WEBSITE_URL=https://marketmaker-nine.vercel.app \
  predictbot
```

Or use docker-compose:

```bash
# Create .env file with your credentials, then:
docker-compose up -d
```

### Website Deployment (Vercel)

The `web/` directory contains a Next.js app for link previews:

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Set root directory to `web`
4. Add environment variables:
   - `KV_REST_API_URL` - Upstash Redis URL
   - `KV_REST_API_TOKEN` - Upstash Redis token
   - `NEXT_PUBLIC_BASE_URL` - Your Vercel URL
   - `NEXT_PUBLIC_BOT_USERNAME` - marketmake67808
5. Deploy

---

## Project Structure

```
├── src/
│   ├── bot.ts                # Bot orchestration
│   ├── config.ts             # Configuration
│   ├── types.ts              # Core types
│   │
│   ├── framework/            # XBot Framework core
│   │   ├── grok-client.ts    # Grok AI integration
│   │   └── types.ts          # Framework types
│   │
│   ├── plugins/              # Bot plugins
│   │   ├── index.ts          # Plugin registry
│   │   └── prediction-market/# Prediction market bot
│   │
│   └── services/             # Core services
│       ├── x-client.ts       # X API client
│       ├── filtered-stream.ts# Real-time stream
│       └── conversation.ts   # Thread handling
│
├── web/                      # Next.js website
│   ├── app/
│   │   ├── r/[id]/          # Market preview pages
│   │   └── api/og/[id]/     # OG image generation
│   └── lib/
│       ├── types.ts         # Data types
│       └── config.ts        # Branding config
│
├── Dockerfile               # Container build
├── docker-compose.yml       # Easy deployment
└── package.json
```

---

## Prediction Market Plugin

The prediction market plugin (`src/plugins/prediction-market/`) handles:

### Tools Available to Grok

1. **create_market** - Creates a new prediction market
   - Extracts the claim from conversation context
   - Frames it as a YES/NO question
   - Assigns a category and resolution date
   - Returns market with initial probability

2. **search_markets** - Searches existing markets
   - Checks if a similar market already exists
   - Returns matching markets by topic

### Market Categories

- Politics
- Economics
- Sports
- Technology
- Entertainment
- Science
- World Events
- Crypto

### Example Interaction

**Original Tweet:**
> "There's no way Bitcoin hits $100k this year"

**Reply:**
> "@marketmake67808 make a market"

**Bot Response:**
> "Market created: 'Will Bitcoin reach $100,000 by Dec 2026?' Currently at 72% YES."
> [Link with rich preview showing probability bars]

---

## Future Enhancements

- **Real API Integration** - Connect to Kalshi, Polymarket, or Manifold APIs
- **Market Resolution** - Automatic resolution based on verified outcomes
- **Trading** - Allow users to buy/sell shares directly via replies
- **Notifications** - Alert market creators when resolution approaches
- **Leaderboards** - Track prediction accuracy

---

## License

MIT
