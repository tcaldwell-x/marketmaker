/**
 * AutoBot - Travel Recommendation Bot
 * Monitors X for mentions and responds with travel recommendations
 */
export declare class AutoBot {
    private isRunning;
    private botUserId;
    /**
     * Initialize and start the bot
     */
    start(): Promise<void>;
    /**
     * Stop the bot
     */
    stop(): Promise<void>;
    /**
     * Register all available plugins
     */
    private registerPlugins;
    /**
     * Initialize the configured plugin
     */
    private initializePlugin;
    /**
     * Check Grok AI status
     */
    private checkGrokStatus;
    /**
     * Fetch the bot's user ID to filter out self-replies
     * Includes retry logic for temporary X API failures
     */
    private fetchBotUserId;
    /**
     * Setup filtered stream rules to capture mentions
     * Includes retry logic for temporary X API failures
     */
    private setupStreamRules;
    private sleep;
    /**
     * Register handlers for the filtered stream
     */
    private registerHandlers;
    /**
     * Handle a mention of the bot
     */
    private handleMention;
    /**
     * Process conversation with Grok and format for tweet
     */
    private processWithGrokAndFormat;
    /**
     * Store data and get a shareable URL
     */
    private storeAndGetUrl;
}
export declare const autoBot: AutoBot;
//# sourceMappingURL=bot.d.ts.map