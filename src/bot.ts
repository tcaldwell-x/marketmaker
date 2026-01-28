import { config } from './config';
import { filteredStream } from './services/filtered-stream';
import { conversationService } from './services/conversation';
import { replyService } from './services/reply';
import { xClient } from './services/x-client';
import { pluginManager, processWithGrok, isGrokConfigured, BotResponse, PluginConfig } from './framework';
import { availablePlugins } from './plugins';
import { StreamData } from './types';

/**
 * AutoBot - Travel Recommendation Bot
 * Monitors X for mentions and responds with travel recommendations
 */
export class AutoBot {
  private isRunning = false;
  private botUserId: string | null = null;
  
  /**
   * Initialize and start the bot
   */
  async start(): Promise<void> {
    console.log('='.repeat(50));
    console.log(`🤖 XBot Framework Starting...`);
    console.log(`📍 Monitoring mentions of @${config.botUsername}`);
    console.log('='.repeat(50));
    
    // Register all available plugins
    this.registerPlugins();
    
    // Initialize the configured plugin
    await this.initializePlugin();
    
    // Check Grok status
    this.checkGrokStatus();
    
    // Get the bot's user ID (needed to ignore self-replies)
    await this.fetchBotUserId();
    
    // Setup stream rules for mentions
    await this.setupStreamRules();
    
    // Register stream handlers
    this.registerHandlers();
    
    // Connect to filtered stream
    this.isRunning = true;
    await filteredStream.connect();
  }
  
  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    console.log('🛑 XBot stopping...');
    this.isRunning = false;
    filteredStream.disconnect();
    await pluginManager.shutdown();
  }
  
  /**
   * Register all available plugins
   */
  private registerPlugins(): void {
    console.log('[Bot] Registering plugins...');
    for (const plugin of availablePlugins) {
      pluginManager.register(plugin);
    }
    console.log(`[Bot] ${availablePlugins.length} plugin(s) registered`);
  }
  
  /**
   * Initialize the configured plugin
   */
  private async initializePlugin(): Promise<void> {
    const pluginId = config.plugin.id;
    console.log(`[Bot] Activating plugin: ${pluginId}`);
    
    const pluginConfig: PluginConfig = {
      env: process.env as Record<string, string | undefined>,
      botUsername: config.botUsername,
      websiteUrl: config.websiteUrl,
      sandboxMode: config.plugin.sandboxMode,
    };
    
    await pluginManager.activate(pluginId, pluginConfig);
  }
  
  /**
   * Check Grok AI status
   */
  private checkGrokStatus(): void {
    if (isGrokConfigured()) {
      console.log('✅ Grok AI configured - using intelligent conversation analysis');
    } else {
      console.log('⚠️  Grok not configured - bot will not function without it');
      console.log('   Set GROK_API_KEY environment variable');
      throw new Error('Grok API key is required');
    }
  }
  
  /**
   * Fetch the bot's user ID to filter out self-replies
   * Includes retry logic for temporary X API failures
   */
  private async fetchBotUserId(retryCount = 0): Promise<void> {
    const maxRetries = 5;
    
    try {
      console.log(`[Bot] Fetching user ID for @${config.botUsername}...`);
      const response = await xClient.getUserByUsername(config.botUsername);
      this.botUserId = response.data.id;
      console.log(`[Bot] Bot user ID: ${this.botUserId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRetryable = errorMsg.includes('503') || errorMsg.includes('Service Unavailable') || 
                          errorMsg.includes('429') || errorMsg.includes('rate limit');
      
      if (isRetryable && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 2000;
        console.log(`[Bot] ⚠️  X API temporarily unavailable, retrying in ${delay/1000}s (attempt ${retryCount + 1}/${maxRetries})`);
        await this.sleep(delay);
        return this.fetchBotUserId(retryCount + 1);
      }
      
      console.error('[Bot] Failed to fetch bot user ID:', error);
      throw new Error('Could not fetch bot user ID - cannot start without it');
    }
  }
  
  /**
   * Setup filtered stream rules to capture mentions
   * Includes retry logic for temporary X API failures
   */
  private async setupStreamRules(retryCount = 0): Promise<void> {
    const maxRetries = 5;
    
    console.log('[Bot] Setting up stream rules...');
    
    try {
      // Get existing rules
      const existingRules = await xClient.getStreamRules();
      
      // Delete existing rules if any
      if (existingRules.data && existingRules.data.length > 0) {
        const ids = existingRules.data.map(rule => rule.id!).filter(Boolean);
        if (ids.length > 0) {
          console.log(`[Bot] Deleting ${ids.length} existing rules`);
          await xClient.deleteStreamRules(ids);
        }
      }
      
      // Add rule for mentions of our bot
      const newRules = [
        {
          value: `@${config.botUsername}`,
          tag: 'bot-mention',
        },
      ];
      
      console.log(`[Bot] Adding rule: @${config.botUsername}`);
      const result = await xClient.addStreamRules(newRules);
      
      if (result.errors && result.errors.length > 0) {
        console.error('[Bot] Rule errors:', result.errors);
      }
      
      if (result.meta?.summary) {
        console.log(`[Bot] Rules created: ${result.meta.summary.created}, valid: ${result.meta.summary.valid}`);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRetryable = errorMsg.includes('503') || errorMsg.includes('Service Unavailable') || 
                          errorMsg.includes('429') || errorMsg.includes('rate limit');
      
      if (isRetryable && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s, 16s, 32s
        console.log(`[Bot] ⚠️  X API temporarily unavailable, retrying in ${delay/1000}s (attempt ${retryCount + 1}/${maxRetries})`);
        await this.sleep(delay);
        return this.setupStreamRules(retryCount + 1);
      }
      
      console.error('[Bot] Failed to setup stream rules:', error);
      throw error;
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Register handlers for the filtered stream
   */
  private registerHandlers(): void {
    // Handle incoming tweets
    filteredStream.onTweet(async (data: StreamData) => {
      await this.handleMention(data);
    });
    
    // Handle errors
    filteredStream.onError((error: Error) => {
      console.error('[Bot] Stream error:', error.message);
    });
  }
  
  /**
   * Handle a mention of the bot
   */
  private async handleMention(data: StreamData): Promise<void> {
    const tweet = data.data;
    const users = data.includes?.users || [];
    
    console.log('\n' + '='.repeat(50));
    console.log(`📥 New mention received!`);
    console.log(`Tweet ID: ${tweet.id}`);
    console.log(`Text: ${tweet.text}`);
    console.log(`Author ID: ${tweet.author_id}`);
    console.log(`Conversation ID: ${tweet.conversation_id}`);
    console.log('='.repeat(50));
    
    // IMPORTANT: Skip tweets from the bot itself to prevent reply loops
    if (tweet.author_id === this.botUserId) {
      console.log('[Bot] ⏭️  Skipping - this is our own tweet');
      return;
    }
    
    // Skip if we've already replied to this specific tweet
    if (replyService.hasReplied(tweet.id)) {
      console.log('[Bot] ⏭️  Already replied to this tweet, skipping');
      return;
    }
    
    // Find the author
    const author = users.find(u => u.id === tweet.author_id);
    
    try {
      // Get the conversation thread for context
      console.log('[Bot] Fetching conversation thread...');
      const thread = await conversationService.getConversationThread(tweet.id);
      
      console.log(`[Bot] Found ${thread.tweets.length} tweets in thread`);
      console.log(conversationService.formatConversation(thread));
      
      // Process with Grok and active plugin
      console.log('[Bot] 🧠 Processing with Grok AI...');
      const replyText = await this.processWithGrokAndFormat(thread);
      
      // Post reply
      console.log('[Bot] Posting reply...');
      await replyService.reply(replyText, tweet.id, author);
      
      console.log('✅ Successfully processed mention!');
      
    } catch (error) {
      console.error('[Bot] Failed to process mention:', error);
    }
  }
  
  /**
   * Process conversation with Grok and format for tweet
   */
  private async processWithGrokAndFormat(thread: import('./types').ConversationThread): Promise<string> {
    const result = await processWithGrok(thread);
    const { response } = result;
    
    let reply = response.message;
    
    // Only add URL for responses that have data (e.g., recommendations)
    if (response.hasData && response.data) {
      const websiteUrl = await this.storeAndGetUrl(response);
      
      // CRITICAL: URL must be within first 280 chars for Twitter link preview
      const urlLength = websiteUrl.length;
      const maxMessageLength = 280 - 2 - urlLength; // 2 for "\n\n"
      
      if (reply.length > maxMessageLength) {
        reply = reply.slice(0, maxMessageLength - 1).trim() + '…';
      }
      
      reply = `${reply}\n\n${websiteUrl}`;
      
      console.log(`[Bot] Final reply length: ${reply.length}/280 chars`);
    } else if (response.directUrl) {
      // Plugin provided a direct URL (no storage needed)
      const urlLength = response.directUrl.length;
      const maxMessageLength = 280 - 2 - urlLength;
      
      if (reply.length > maxMessageLength) {
        reply = reply.slice(0, maxMessageLength - 1).trim() + '…';
      }
      
      reply = `${reply}\n\n${response.directUrl}`;
      console.log(`[Bot] Reply with direct URL: ${reply.length}/280 chars`);
    } else {
      // Conversational response - just ensure it fits
      if (reply.length > 280) {
        reply = reply.slice(0, 279).trim() + '…';
      }
      console.log(`[Bot] Conversational reply: ${reply.length}/280 chars`);
    }
    
    return reply;
  }
  
  /**
   * Store data and get a shareable URL
   */
  private async storeAndGetUrl(response: BotResponse): Promise<string> {
    const data = response.data!;
    const metadata = data.metadata as Record<string, any> | undefined;
    
    // Determine the type of data
    const isMarket = metadata?.type === 'market_created' || metadata?.type === 'market_existing';
    const isReservation = metadata?.type === 'reservation';
    
    // Map StorableData to the API format
    const apiData: Record<string, any> = {
      destination: data.title,
      searchUrl: data.actionUrl,
      type: isMarket ? 'market' : isReservation ? 'reservation' : 'travel',
    };
    
    if (isMarket && metadata) {
      // Prediction market data
      apiData.market = {
        id: metadata.market_id,
        question: metadata.question,
        description: metadata.description,
        category: metadata.category,
        category_display: metadata.category_display,
        resolution_date: metadata.resolution_date,
        resolution_date_formatted: metadata.resolution_date_formatted,
        yes_probability: metadata.yes_probability,
        yes_probability_formatted: metadata.yes_probability_formatted,
        no_probability: metadata.no_probability,
        volume: metadata.volume,
        volume_formatted: metadata.volume_formatted,
        traders: metadata.traders,
        source_claim: metadata.source_claim,
        status: metadata.status || 'open',
        is_new: metadata.type === 'market_created',
      };
    } else if (isReservation && metadata) {
      // Reservation data (legacy)
      apiData.reservation = {
        confirmation_number: metadata.confirmation_number,
        restaurant_name: metadata.restaurant?.name,
        cuisine: metadata.restaurant?.cuisine,
        neighborhood: metadata.restaurant?.neighborhood,
        address: metadata.restaurant?.address,
        phone: metadata.restaurant?.phone,
        rating: metadata.restaurant?.rating,
        price_range: metadata.restaurant?.price_range,
        date: metadata.date,
        date_formatted: data.subtitle?.split(' at ')[0] || metadata.date,
        time: metadata.time,
        time_formatted: data.subtitle?.split(' at ')[1] || metadata.time,
        party_size: metadata.party_size,
        special_requests: metadata.special_requests,
      };
    } else {
      // Travel/other data (legacy)
      apiData.hotel = data.primaryItem ? {
        name: data.primaryItem.name,
        price: data.primaryItem.price,
        rating: data.primaryItem.rating,
      } : undefined;
      apiData.activity = data.secondaryItem ? {
        title: data.secondaryItem.name,
        price: data.secondaryItem.price,
      } : undefined;
    }
    
    try {
      const apiUrl = `${config.websiteUrl}/api/recommendations`;
      console.log(`[Bot] Storing ${apiData.type}: ${apiUrl}`);
      console.log(`[Bot] Data being sent:`, JSON.stringify(apiData, null, 2));
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });
      
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        console.log(`[Bot] Short URL: ${url}`);
        return url;
      } else {
        const errText = await res.text();
        console.error(`[Bot] API failed (${res.status}): ${errText}`);
      }
    } catch (err) {
      console.error('[Bot] API error:', err);
    }
    
    // Fallback to action URL
    return data.actionUrl;
  }
}

export const autoBot = new AutoBot();
