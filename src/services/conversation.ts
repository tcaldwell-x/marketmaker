import { xClient } from './x-client';
import { Tweet, User, ConversationThread } from '../types';

/**
 * Conversation Service
 * Fetches and organizes conversation threads from X
 */
export class ConversationService {
  
  /**
   * Get the full conversation thread for a given tweet
   * Uses conversation_id to find all tweets in the thread
   */
  async getConversationThread(tweetId: string): Promise<ConversationThread> {
    try {
      // First, get the tweet that mentioned us
      const { data: mentionTweet, includes } = await xClient.getTweet(tweetId);
      
      if (!mentionTweet.conversation_id) {
        console.log('[Conversation] No conversation_id, treating as standalone tweet');
        return {
          tweets: [mentionTweet],
          participants: includes?.users || [],
        };
      }
      
      const conversationId = mentionTweet.conversation_id;
      const allTweets: Tweet[] = [mentionTweet];
      const allUsers: User[] = includes?.users || [];
      
      // If this tweet is a reply, fetch the original/parent tweet directly
      // This is more reliable than search which may not index recent tweets
      if (conversationId !== tweetId) {
        try {
          console.log(`[Conversation] Fetching original tweet: ${conversationId}`);
          const { data: originalTweet, includes: origIncludes } = await xClient.getTweet(conversationId);
          
          if (originalTweet && !allTweets.find(t => t.id === originalTweet.id)) {
            allTweets.push(originalTweet);
          }
          if (origIncludes?.users) {
            for (const user of origIncludes.users) {
              if (!allUsers.find(u => u.id === user.id)) {
                allUsers.push(user);
              }
            }
          }
        } catch (err) {
          console.log('[Conversation] Could not fetch original tweet:', err);
        }
      }
      
      // Also fetch the tweet this is replying to (if different from original)
      if (mentionTweet.referenced_tweets) {
        for (const ref of mentionTweet.referenced_tweets) {
          if (ref.type === 'replied_to' && ref.id !== conversationId) {
            try {
              console.log(`[Conversation] Fetching parent tweet: ${ref.id}`);
              const { data: parentTweet, includes: parentIncludes } = await xClient.getTweet(ref.id);
              
              if (parentTweet && !allTweets.find(t => t.id === parentTweet.id)) {
                allTweets.push(parentTweet);
              }
              if (parentIncludes?.users) {
                for (const user of parentIncludes.users) {
                  if (!allUsers.find(u => u.id === user.id)) {
                    allUsers.push(user);
                  }
                }
              }
            } catch (err) {
              console.log('[Conversation] Could not fetch parent tweet:', err);
            }
          }
        }
      }
      
      // Also try search for additional context (may not return recent tweets)
      try {
        const query = `conversation_id:${conversationId}`;
        console.log(`[Conversation] Searching thread for conversation: ${conversationId}`);
        const searchResult = await xClient.searchTweets(query, 100);
        
        if (searchResult.data) {
          for (const tweet of searchResult.data) {
            if (!allTweets.find(t => t.id === tweet.id)) {
              allTweets.push(tweet);
            }
          }
        }
        if (searchResult.includes?.users) {
          for (const user of searchResult.includes.users) {
            if (!allUsers.find(u => u.id === user.id)) {
              allUsers.push(user);
            }
          }
        }
      } catch (err) {
        console.log('[Conversation] Search failed, using direct fetches only');
      }
      
      // Sort tweets by created_at (oldest first)
      const sortedTweets = allTweets.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      });
      
      console.log(`[Conversation] Found ${sortedTweets.length} tweets in thread`);
      
      const originalTweet = sortedTweets.find(t => t.id === conversationId);
      
      return {
        tweets: sortedTweets,
        participants: allUsers,
        originalTweet,
      };
    } catch (error) {
      console.error('[Conversation] Error fetching thread:', error);
      throw error;
    }
  }
  
  /**
   * Extract travel-related context from a conversation
   * This is a simple extraction - can be enhanced with NLP/AI later
   */
  extractTravelContext(thread: ConversationThread): TravelContext {
    const allText = thread.tweets.map(t => t.text).join(' ').toLowerCase();
    
    // Simple keyword extraction (placeholder - can use Grok/AI later)
    const context: TravelContext = {
      destinations: this.extractDestinations(allText),
      dates: this.extractDates(allText),
      travelers: this.extractTravelerCount(allText),
      preferences: this.extractPreferences(allText),
      rawText: allText,
    };
    
    console.log('[Conversation] Extracted travel context:', context);
    
    return context;
  }
  
  /**
   * Extract potential destination names
   */
  private extractDestinations(text: string): string[] {
    // Common travel destinations (placeholder - would use NER/AI in production)
    const commonDestinations = [
      // US Cities
      'new york', 'nyc', 'manhattan', 'brooklyn',
      'los angeles', 'la', 'hollywood',
      'chicago', 'miami', 'miami beach', 'south beach',
      'las vegas', 'vegas',
      'san francisco', 'sf', 'san jose', 'silicon valley',
      'seattle', 'boston', 'denver', 'austin', 'dallas', 'houston',
      'san diego', 'phoenix', 'philadelphia', 'philly',
      'atlanta', 'nashville', 'new orleans', 'nola',
      'orlando', 'tampa', 'fort lauderdale',
      'portland', 'salt lake city', 'minneapolis',
      'washington dc', 'dc', 'baltimore',
      'charlotte', 'raleigh', 'charleston',
      'savannah', 'memphis', 'st louis',
      'kansas city', 'indianapolis', 'columbus', 'cleveland', 'detroit',
      // US States/Regions
      'hawaii', 'maui', 'oahu', 'honolulu', 'waikiki', 'kauai', 'big island',
      'california', 'florida', 'texas', 'colorado', 'arizona',
      'alaska', 'puerto rico',
      // US Beach/Resort destinations
      'myrtle beach', 'virginia beach', 'outer banks',
      'key west', 'florida keys', 'clearwater', 'destin', 'panama city beach',
      'santa monica', 'malibu', 'laguna beach', 'san juan',
      // Mexico & Caribbean
      'cancun', 'cabo', 'cabo san lucas', 'puerto vallarta', 'tulum', 'playa del carmen',
      'mexico city', 'cozumel', 'riviera maya',
      'bahamas', 'nassau', 'jamaica', 'montego bay', 'punta cana',
      'aruba', 'barbados', 'st lucia', 'turks and caicos', 'virgin islands',
      'caribbean', 'cayman islands', 'bermuda', 'curacao',
      // Canada
      'toronto', 'vancouver', 'montreal', 'quebec', 'calgary', 'banff', 'whistler', 'niagara falls',
      // Europe
      'london', 'paris', 'rome', 'barcelona', 'madrid', 'lisbon',
      'amsterdam', 'berlin', 'munich', 'vienna', 'prague', 'budapest',
      'dublin', 'edinburgh', 'scotland', 'ireland',
      'greece', 'athens', 'santorini', 'mykonos',
      'italy', 'florence', 'venice', 'milan', 'amalfi', 'sicily',
      'france', 'nice', 'french riviera', 'provence',
      'spain', 'ibiza', 'mallorca', 'seville',
      'portugal', 'porto', 'algarve',
      'switzerland', 'zurich', 'geneva', 'alps',
      'croatia', 'dubrovnik', 'split',
      'iceland', 'reykjavik',
      'norway', 'sweden', 'stockholm', 'copenhagen', 'denmark', 'finland', 'helsinki',
      // Asia
      'tokyo', 'japan', 'kyoto', 'osaka',
      'thailand', 'bangkok', 'phuket', 'bali', 'indonesia',
      'singapore', 'hong kong', 'vietnam', 'hanoi', 'ho chi minh',
      'south korea', 'seoul', 'taiwan', 'taipei',
      'china', 'beijing', 'shanghai',
      'india', 'delhi', 'mumbai', 'goa',
      'philippines', 'manila', 'boracay', 'palawan',
      'malaysia', 'kuala lumpur',
      'cambodia', 'siem reap', 'angkor wat',
      'maldives', 'sri lanka',
      // Middle East
      'dubai', 'abu dhabi', 'uae', 'israel', 'tel aviv', 'jerusalem', 'jordan', 'petra',
      'turkey', 'istanbul', 'egypt', 'cairo',
      // Australia/Pacific
      'australia', 'sydney', 'melbourne', 'brisbane', 'gold coast', 'perth', 'great barrier reef',
      'new zealand', 'auckland', 'queenstown',
      'fiji', 'tahiti', 'bora bora', 'french polynesia',
      // Africa
      'south africa', 'cape town', 'johannesburg', 'safari',
      'morocco', 'marrakech', 'kenya', 'tanzania', 'zanzibar',
      // South America
      'brazil', 'rio', 'rio de janeiro', 'sao paulo',
      'argentina', 'buenos aires', 'patagonia',
      'peru', 'lima', 'machu picchu', 'cusco',
      'colombia', 'cartagena', 'medellin',
      'chile', 'santiago', 'costa rica', 'ecuador', 'galapagos',
    ];
    
    const found = commonDestinations.filter(dest => text.includes(dest));
    
    // Sort by length (longer matches first to prefer "new york" over "york")
    return found.sort((a, b) => b.length - a.length);
  }
  
  /**
   * Extract date-related mentions
   */
  private extractDates(text: string): string[] {
    const datePatterns = [
      /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
      /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/g,
      /\b(next|this)\s+(week|weekend|month)\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    ];
    
    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }
    
    return [...new Set(dates)];
  }
  
  /**
   * Extract number of travelers
   */
  private extractTravelerCount(text: string): number | undefined {
    const patterns = [
      /(\d+)\s*(people|persons|travelers|guests|adults)/i,
      /(two|three|four|five|six)\s*(people|of us)/i,
      /party of (\d+)/i,
      /(\d+)\s*of us/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const num = match[1];
        const wordToNum: Record<string, number> = {
          'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6
        };
        return wordToNum[num.toLowerCase()] || parseInt(num, 10);
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract travel preferences
   */
  private extractPreferences(text: string): string[] {
    const preferenceKeywords = [
      'budget', 'luxury', 'cheap', 'affordable', 'boutique',
      'beach', 'mountain', 'city', 'resort', 'downtown',
      'family', 'romantic', 'business', 'adventure',
      'direct flight', 'non-stop', 'layover', 'first class', 'economy',
      'pool', 'spa', 'gym', 'breakfast', 'pet-friendly',
    ];
    
    return preferenceKeywords.filter(pref => text.includes(pref));
  }
  
  /**
   * Format conversation for display/logging
   */
  formatConversation(thread: ConversationThread): string {
    const lines: string[] = ['=== Conversation Thread ==='];
    
    for (const tweet of thread.tweets) {
      const user = thread.participants.find(u => u.id === tweet.author_id);
      const username = user?.username || 'unknown';
      lines.push(`@${username}: ${tweet.text}`);
      lines.push('---');
    }
    
    return lines.join('\n');
  }
}

export interface TravelContext {
  destinations: string[];
  dates: string[];
  travelers?: number;
  preferences: string[];
  rawText: string;
}

export const conversationService = new ConversationService();
