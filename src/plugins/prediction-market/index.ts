/**
 * Prediction Market Plugin
 * 
 * A bot that creates prediction markets from tweets.
 * When users mention @predictbot asking to create a market,
 * it analyzes the conversation and creates a prediction market.
 */

import { BotPlugin, PluginConfig, ToolContext, ToolResult, Tool, StorableData } from '../../framework/types';

/**
 * System prompt for the prediction market assistant
 */
const SYSTEM_PROMPT = `You are @predictbot, a prediction market bot on X (Twitter).

YOUR PURPOSE:
Users mention you when they want to create a prediction market based on a claim or prediction someone made.
You analyze the conversation, identify the prediction/claim, and create a market for it.

HOW IT WORKS:
1. Someone posts a claim like "I bet China won't invade Taiwan" or "The Fed will cut rates in March"
2. Another user replies mentioning you: "Hey @predictbot create a market for this"
3. You identify the claim and create a prediction market

CREATING MARKETS:
- ALWAYS call create_market when asked to create a market
- Extract the core prediction from the conversation
- Frame it as a clear YES/NO question with a resolution date
- Be specific about the timeframe (add year if not specified, use current year or next year as appropriate)
- Make the question objective and verifiable

QUESTION FRAMING RULES:
- Convert negative claims to positive questions: "won't invade" → "Will China invade Taiwan by [date]?"
- Add specific timeframes: "Fed will cut rates" → "Will the Fed cut rates by March 2026?"
- Make it binary and verifiable
- Keep questions under 100 characters when possible

RESPONSE RULES:
- Keep responses under 200 characters (link is appended automatically)
- Be concise and confident
- Don't use emojis
- Don't say "I've created" - just present the market
- Example: "Market created: 'Will China invade Taiwan by end of 2026?' Currently at 15% YES."

WHEN NOT TO CREATE A MARKET:
- If the request is unclear, ask for clarification
- If no prediction/claim is found in the thread, explain what you need
- For casual conversation, respond naturally without using tools

NEVER:
- Include URLs in your response (system adds them)
- Create markets for illegal/harmful content
- Make up probabilities - use the ones from the tool result`;

/**
 * Tool definitions for prediction markets
 */
const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'create_market',
      description: 'Create a new prediction market. Use this when a user asks you to create a market for a claim or prediction.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The prediction market question, framed as a YES/NO question (e.g., "Will China invade Taiwan by end of 2026?")',
          },
          description: {
            type: 'string',
            description: 'Additional context or resolution criteria for the market',
          },
          category: {
            type: 'string',
            description: 'Category for the market',
            enum: ['politics', 'economics', 'sports', 'technology', 'entertainment', 'science', 'world-events', 'crypto', 'other'],
          },
          resolution_date: {
            type: 'string',
            description: 'When the market should resolve, in YYYY-MM-DD format',
          },
          source_claim: {
            type: 'string',
            description: 'The original claim or prediction from the tweet that inspired this market',
          },
        },
        required: ['question', 'category', 'resolution_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_markets',
      description: 'Search for existing prediction markets on a topic. Use this to check if a similar market already exists.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find related markets',
          },
          category: {
            type: 'string',
            description: 'Optional category filter',
            enum: ['politics', 'economics', 'sports', 'technology', 'entertainment', 'science', 'world-events', 'crypto', 'other'],
          },
        },
        required: ['query'],
      },
    },
  },
];

/**
 * Mock market data storage (in production, this would be a database)
 */
interface Market {
  id: string;
  question: string;
  description?: string;
  category: string;
  resolution_date: string;
  created_at: string;
  yes_probability: number;
  no_probability: number;
  volume: number;
  traders: number;
  source_claim?: string;
  status: 'open' | 'resolved' | 'closed';
  url: string;
}

// Store the website URL from config (set during initialization)
let websiteUrl = 'https://marketmaker-nine.vercel.app';

/**
 * Generate market URL using configured website URL
 */
function getMarketUrl(marketId: string): string {
  return `${websiteUrl}/r/${marketId}`;
}

// Simulated existing markets for search (URLs are generated dynamically)
function getExistingMarkets(): Market[] {
  return [
    {
      id: 'mkt-fed-rates-2026',
      question: 'Will the Fed cut interest rates by March 2026?',
      description: 'Resolves YES if the Federal Reserve announces a rate cut before March 31, 2026.',
      category: 'economics',
      resolution_date: '2026-03-31',
      created_at: '2025-12-01',
      yes_probability: 0.65,
      no_probability: 0.35,
      volume: 125000,
      traders: 1832,
      status: 'open',
      url: getMarketUrl('mkt-fed-rates-2026'),
    },
    {
      id: 'mkt-btc-100k-2026',
      question: 'Will Bitcoin reach $100,000 by end of 2026?',
      description: 'Resolves YES if BTC/USD reaches $100,000 on any major exchange before Dec 31, 2026.',
      category: 'crypto',
      resolution_date: '2026-12-31',
      created_at: '2025-11-15',
      yes_probability: 0.72,
      no_probability: 0.28,
      volume: 890000,
      traders: 5621,
      status: 'open',
      url: getMarketUrl('mkt-btc-100k-2026'),
    },
    {
      id: 'mkt-taiwan-2026',
      question: 'Will China invade Taiwan by end of 2026?',
      description: 'Resolves YES if Chinese military forces conduct an armed invasion of Taiwan before Dec 31, 2026.',
      category: 'world-events',
      resolution_date: '2026-12-31',
      created_at: '2025-10-01',
      yes_probability: 0.08,
      no_probability: 0.92,
      volume: 2100000,
      traders: 12453,
      status: 'open',
      url: getMarketUrl('mkt-taiwan-2026'),
    },
  ];
}

/**
 * Generate a unique market ID
 */
function generateMarketId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'mkt-';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Generate initial probability based on question sentiment/topic
 */
function generateInitialProbability(question: string): number {
  const lowerQ = question.toLowerCase();
  
  // Low probability events
  if (lowerQ.includes('invade') || lowerQ.includes('war') || lowerQ.includes('nuclear')) {
    return 0.05 + Math.random() * 0.15; // 5-20%
  }
  
  // Higher probability for positive economic events
  if (lowerQ.includes('rate cut') || lowerQ.includes('growth')) {
    return 0.45 + Math.random() * 0.25; // 45-70%
  }
  
  // Crypto tends to be optimistic
  if (lowerQ.includes('bitcoin') || lowerQ.includes('btc') || lowerQ.includes('crypto')) {
    return 0.40 + Math.random() * 0.35; // 40-75%
  }
  
  // Default: somewhere in the middle
  return 0.30 + Math.random() * 0.40; // 30-70%
}

/**
 * Format probability as percentage
 */
function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get category display name
 */
function getCategoryDisplay(category: string): string {
  const displays: Record<string, string> = {
    'politics': 'Politics',
    'economics': 'Economics',
    'sports': 'Sports',
    'technology': 'Tech',
    'entertainment': 'Entertainment',
    'science': 'Science',
    'world-events': 'World Events',
    'crypto': 'Crypto',
    'other': 'Other',
  };
  return displays[category] || category;
}

/**
 * Prediction Market Plugin
 */
export const predictionMarketPlugin: BotPlugin = {
  id: 'prediction-market',
  name: 'Prediction Market Bot',
  description: 'A bot that creates prediction markets from tweets and claims.',
  version: '1.0.0',
  
  systemPrompt: SYSTEM_PROMPT,
  tools: TOOLS,
  
  async initialize(config: PluginConfig): Promise<void> {
    // Store the website URL for generating market links
    websiteUrl = config.websiteUrl;
    
    // In production, we'd initialize connections to prediction market APIs
    // (Kalshi, Polymarket, Manifold, etc.)
    console.log('[Prediction Market Plugin] Initialized');
    console.log('[Prediction Market Plugin] Mode:', config.sandboxMode ? 'SANDBOX' : 'LIVE');
    console.log('[Prediction Market Plugin] Website URL:', websiteUrl);
    
    // Could check for API keys here
    // const kalshiApiKey = config.env.KALSHI_API_KEY;
    // const polymarketApiKey = config.env.POLYMARKET_API_KEY;
  },
  
  async executeTool(context: ToolContext): Promise<ToolResult> {
    const { toolName, arguments: args } = context;
    
    try {
      switch (toolName) {
        case 'create_market': {
          const question = args.question as string;
          const description = args.description as string | undefined;
          const category = args.category as string;
          const resolutionDate = args.resolution_date as string;
          const sourceClaim = args.source_claim as string | undefined;
          
          // Check for similar existing markets
          const similar = getExistingMarkets().find(m => 
            m.question.toLowerCase().includes(question.toLowerCase().slice(0, 30)) ||
            question.toLowerCase().includes(m.question.toLowerCase().slice(0, 30))
          );
          
          if (similar) {
            // Return the existing market instead of creating a duplicate
            return {
              success: true,
              data: {
                type: 'existing_market',
                market: {
                  id: similar.id,
                  question: similar.question,
                  description: similar.description,
                  category: similar.category,
                  category_display: getCategoryDisplay(similar.category),
                  resolution_date: similar.resolution_date,
                  resolution_date_formatted: formatDate(similar.resolution_date),
                  yes_probability: similar.yes_probability,
                  yes_probability_formatted: formatProbability(similar.yes_probability),
                  no_probability: similar.no_probability,
                  volume: similar.volume,
                  volume_formatted: `$${(similar.volume / 1000).toFixed(0)}K`,
                  traders: similar.traders,
                  status: similar.status,
                  url: similar.url,
                },
                message: 'A similar market already exists',
              },
            };
          }
          
          // Create new market
          const marketId = generateMarketId();
          const yesProbability = generateInitialProbability(question);
          
          const newMarket: Market = {
            id: marketId,
            question,
            description,
            category,
            resolution_date: resolutionDate,
            created_at: new Date().toISOString().split('T')[0],
            yes_probability: yesProbability,
            no_probability: 1 - yesProbability,
            volume: Math.floor(Math.random() * 5000) + 500, // Initial volume $500-$5500
            traders: Math.floor(Math.random() * 50) + 10, // Initial traders 10-60
            source_claim: sourceClaim,
            status: 'open',
            url: getMarketUrl(marketId),
          };
          
          return {
            success: true,
            data: {
              type: 'new_market',
              market: {
                id: newMarket.id,
                question: newMarket.question,
                description: newMarket.description,
                category: newMarket.category,
                category_display: getCategoryDisplay(newMarket.category),
                resolution_date: newMarket.resolution_date,
                resolution_date_formatted: formatDate(newMarket.resolution_date),
                yes_probability: newMarket.yes_probability,
                yes_probability_formatted: formatProbability(newMarket.yes_probability),
                no_probability: newMarket.no_probability,
                volume: newMarket.volume,
                volume_formatted: `$${newMarket.volume.toLocaleString()}`,
                traders: newMarket.traders,
                source_claim: newMarket.source_claim,
                status: newMarket.status,
                url: newMarket.url,
              },
            },
          };
        }
        
        case 'search_markets': {
          const query = (args.query as string).toLowerCase();
          const categoryFilter = args.category as string | undefined;
          
          let results = getExistingMarkets().filter(m => {
            const matchesQuery = m.question.toLowerCase().includes(query) ||
              (m.description?.toLowerCase().includes(query) ?? false);
            const matchesCategory = !categoryFilter || m.category === categoryFilter;
            return matchesQuery && matchesCategory;
          });
          
          return {
            success: true,
            data: {
              type: 'search_results',
              query,
              category: categoryFilter,
              markets: results.slice(0, 5).map(m => ({
                id: m.id,
                question: m.question,
                category: m.category,
                category_display: getCategoryDisplay(m.category),
                yes_probability: m.yes_probability,
                yes_probability_formatted: formatProbability(m.yes_probability),
                volume_formatted: `$${(m.volume / 1000).toFixed(0)}K`,
                traders: m.traders,
                resolution_date_formatted: formatDate(m.resolution_date),
                url: m.url,
              })),
              total_results: results.length,
            },
          };
        }
        
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`[Prediction Market Plugin] Tool ${toolName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  
  extractStorableData(toolResults: ToolResult[], grokMessage?: string): StorableData | null {
    for (const result of toolResults) {
      if (!result.success || !result.data) continue;
      
      const data = result.data as any;
      
      // Handle both new and existing markets
      if ((data.type === 'new_market' || data.type === 'existing_market') && data.market) {
        const market = data.market;
        
        return {
          title: market.question,
          subtitle: `${market.category_display} · Resolves ${market.resolution_date_formatted}`,
          primaryItem: {
            name: 'YES',
            price: market.yes_probability_formatted,
            rating: market.yes_probability, // Use probability as "rating" for display
          },
          secondaryItem: {
            name: market.volume_formatted + ' volume',
            price: `${market.traders} traders`,
          },
          actionUrl: market.url,
          metadata: {
            type: data.type === 'new_market' ? 'market_created' : 'market_existing',
            market_id: market.id,
            question: market.question,
            description: market.description,
            category: market.category,
            category_display: market.category_display,
            resolution_date: market.resolution_date,
            resolution_date_formatted: market.resolution_date_formatted,
            yes_probability: market.yes_probability,
            yes_probability_formatted: market.yes_probability_formatted,
            no_probability: market.no_probability,
            volume: market.volume,
            volume_formatted: market.volume_formatted,
            traders: market.traders,
            source_claim: market.source_claim,
            status: market.status,
          },
        };
      }
      
      // Handle search results - link to first result
      if (data.type === 'search_results' && data.markets?.length > 0) {
        const market = data.markets[0];
        
        return {
          title: market.question,
          subtitle: `${market.category_display} · ${market.volume_formatted} volume`,
          primaryItem: {
            name: 'YES',
            price: market.yes_probability_formatted,
            rating: market.yes_probability,
          },
          secondaryItem: {
            name: `${data.total_results} related markets`,
            price: market.resolution_date_formatted,
          },
          actionUrl: market.url,
          metadata: {
            type: 'search_result',
            market_id: market.id,
            question: market.question,
            category: market.category,
            yes_probability: market.yes_probability,
            yes_probability_formatted: market.yes_probability_formatted,
            total_results: data.total_results,
          },
        };
      }
    }
    
    return null;
  },
};

export default predictionMarketPlugin;
