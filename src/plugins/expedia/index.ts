/**
 * Expedia Travel Bot Plugin
 * 
 * A bot that helps users find hotels, vacation rentals, car rentals, and activities.
 * Powered by Expedia Group APIs.
 * 
 * This serves as the example/reference implementation for the XBot framework.
 */

import { BotPlugin, PluginConfig, ToolContext, ToolResult, Tool, StorableData } from '../../framework/types';
import { ExpediaClient, initExpediaClient, getExpediaClient } from '../../services/expedia';

/**
 * System prompt for the travel assistant
 */
const SYSTEM_PROMPT = `You are a helpful travel assistant bot on X (Twitter). Users mention you with travel-related questions.

IMPORTANT: You operate in TWO modes:

## MODE 1: CONVERSATIONAL (default)
For general travel questions, advice, tips, or when the user is just chatting:
- Answer helpfully and conversationally
- Do NOT use the search tools
- Do NOT provide specific hotel/price recommendations
- Just have a natural conversation about travel
- Examples: "What's the best time to visit Japan?", "Is Paris worth visiting?", "Any tips for traveling with kids?"

## MODE 2: RECOMMENDATIONS
ONLY when the user explicitly asks for specific recommendations, bookings, hotels, or places to stay:
- Use the search tools to find real options
- Provide specific recommendations with prices
- Examples: "Find me a hotel in Miami", "I need recommendations for Austin", "Where should I stay in NYC?"

CRITICAL RESPONSE RULES:
- Keep responses under 180 characters when using tools
- Keep responses under 270 characters for conversation
- Be concise! Every character counts
- DO NOT include "[link]" or any placeholder text - the system automatically appends URLs
- DO NOT say "More details:" or "Click here:" - just end your message naturally
- Never use emojis

Example good response: "In Miami, stay at Fontainebleau for $289/night. Try the Everglades Airboat Tour for $49!"
Example bad response: "In Miami, stay at Fontainebleau for $289/night. More details: [link]"

Guidelines for recommendations:
- If dates aren't specified, use reasonable defaults (1-2 weeks from now, 3-night stay)
- Consider preferences: "romantic" → boutique hotels, "family" → vacation rentals, "budget" → affordable options`;

/**
 * Tool definitions for Expedia APIs
 */
const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'search_hotels',
      description: 'Search for hotels in a destination. Use this when the user wants hotel recommendations.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'The city or destination to search for hotels (e.g., "Miami", "New York", "Paris")',
          },
          checkin: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
          },
          checkout: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format',
          },
          guests: {
            type: 'number',
            description: 'Number of guests (default: 2)',
          },
        },
        required: ['destination', 'checkin', 'checkout'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_vacation_rentals',
      description: 'Search for vacation rentals (Vrbo) like houses, condos, villas. Use for family trips or groups wanting more space.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'The city or destination to search',
          },
          checkin: {
            type: 'string',
            description: 'Check-in date in YYYY-MM-DD format',
          },
          checkout: {
            type: 'string',
            description: 'Check-out date in YYYY-MM-DD format',
          },
          guests: {
            type: 'number',
            description: 'Number of guests',
          },
          bedrooms: {
            type: 'number',
            description: 'Minimum number of bedrooms needed',
          },
        },
        required: ['destination', 'checkin', 'checkout'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_car_rentals',
      description: 'Search for rental cars. Use when users need transportation at their destination.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'Pickup location (city or airport code like "LAX", "Miami")',
          },
          pickup_date: {
            type: 'string',
            description: 'Pickup date in YYYY-MM-DD format',
          },
          dropoff_date: {
            type: 'string',
            description: 'Drop-off date in YYYY-MM-DD format',
          },
        },
        required: ['location', 'pickup_date', 'dropoff_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_activities',
      description: 'Search for things to do, tours, and activities at a destination.',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'The city or destination to search for activities',
          },
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format',
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format',
          },
          travelers: {
            type: 'number',
            description: 'Number of travelers',
          },
        },
        required: ['destination', 'start_date', 'end_date'],
      },
    },
  },
];

/**
 * Expedia Travel Bot Plugin
 */
export const expediaPlugin: BotPlugin = {
  id: 'expedia',
  name: 'Expedia Travel Bot',
  description: 'A travel assistant that helps users find hotels, vacation rentals, car rentals, and activities powered by Expedia Group APIs.',
  version: '1.0.0',
  
  systemPrompt: SYSTEM_PROMPT,
  tools: TOOLS,
  
  async initialize(config: PluginConfig): Promise<void> {
    const apiKey = config.env.EXPEDIA_API_KEY || '';
    const sharedSecret = config.env.EXPEDIA_SHARED_SECRET || '';
    const affiliateId = config.env.EXPEDIA_AFFILIATE_ID || 'xbot-framework';
    
    if (apiKey && sharedSecret && !config.sandboxMode) {
      initExpediaClient(apiKey, sharedSecret, affiliateId, false);
      console.log('[Expedia Plugin] ✅ Using LIVE Expedia API');
    } else {
      initExpediaClient('sandbox', 'sandbox', affiliateId, true);
      console.log('[Expedia Plugin] 🧪 Using SANDBOX mode with simulated data');
    }
  },
  
  async executeTool(context: ToolContext): Promise<ToolResult> {
    const client = getExpediaClient();
    if (!client) {
      return { success: false, error: 'Expedia client not initialized' };
    }
    
    const { toolName, arguments: args } = context;
    
    try {
      switch (toolName) {
        case 'search_hotels': {
          const hotels = await client.findHotels(
            args.destination as string,
            args.checkin as string,
            args.checkout as string,
            (args.guests as number) || 2
          );
          return {
            success: true,
            data: {
              type: 'hotels',
              destination: args.destination,
              items: hotels.slice(0, 3).map(h => ({
                name: h.name,
                price_per_night: h.price_per_night,
                total_price: h.total_price,
                rating: h.guest_rating,
                amenities: h.amenities.slice(0, 3),
                booking_url: h.booking_url,
              })),
            },
          };
        }
        
        case 'search_vacation_rentals': {
          const rentals = await client.findVacationRentals(
            args.destination as string,
            args.checkin as string,
            args.checkout as string,
            (args.guests as number) || 2,
            args.bedrooms as number | undefined
          );
          return {
            success: true,
            data: {
              type: 'vacation_rentals',
              destination: args.destination,
              items: rentals.slice(0, 3).map(r => ({
                name: r.name,
                property_type: r.property_type,
                bedrooms: r.bedrooms,
                sleeps: r.sleeps,
                price_per_night: r.price_per_night,
                total_price: r.total_price,
                rating: r.rating,
                booking_url: r.booking_url,
              })),
            },
          };
        }
        
        case 'search_car_rentals': {
          const cars = await client.findCarRentals(
            args.location as string,
            args.pickup_date as string,
            args.dropoff_date as string
          );
          return {
            success: true,
            data: {
              type: 'car_rentals',
              location: args.location,
              items: cars.slice(0, 3).map(c => ({
                company: c.supplier,
                car_type: c.vehicle_category,
                car_name: c.vehicle_description,
                price_per_day: c.price_per_day,
                total_price: c.total_price,
                features: c.features,
                booking_url: c.booking_url,
              })),
            },
          };
        }
        
        case 'search_activities': {
          const activities = await client.findActivities(
            args.destination as string,
            args.start_date as string,
            args.end_date as string,
            (args.travelers as number) || 2
          );
          return {
            success: true,
            data: {
              type: 'activities',
              destination: args.destination,
              items: activities.slice(0, 3).map(a => ({
                title: a.title,
                price: a.price_formatted,
                duration: a.duration,
                rating: a.rating,
                booking_url: a.booking_url,
              })),
            },
          };
        }
        
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`[Expedia Plugin] Tool ${toolName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  
  extractStorableData(toolResults: ToolResult[]): StorableData | null {
    let destination = '';
    let hotel: { name: string; price_per_night: number; rating?: number; booking_url: string } | null = null;
    let activity: { title: string; price: string; booking_url: string } | null = null;
    let actionUrl = 'https://www.expedia.com';
    
    for (const result of toolResults) {
      if (!result.success || !result.data) continue;
      
      const data = result.data as { type: string; destination?: string; location?: string; items: any[] };
      
      if (data.destination) destination = data.destination;
      if (data.location) destination = data.location;
      
      if (data.type === 'hotels' && data.items.length > 0) {
        hotel = data.items[0];
        actionUrl = hotel!.booking_url;
      }
      
      if (data.type === 'activities' && data.items.length > 0) {
        activity = data.items[0];
        if (!hotel) actionUrl = activity!.booking_url;
      }
    }
    
    if (!hotel && !activity) return null;
    
    return {
      title: destination || 'Travel Recommendations',
      primaryItem: hotel ? {
        name: hotel.name,
        price: `$${hotel.price_per_night}/night`,
        rating: hotel.rating,
      } : undefined,
      secondaryItem: activity ? {
        name: activity.title,
        price: activity.price,
      } : undefined,
      actionUrl,
    };
  },
};

export default expediaPlugin;
