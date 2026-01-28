import { Tweet, User, RulesResponse, StreamRule, Media } from '../types';
/**
 * X API Client
 * Handles both OAuth 2.0 (Bearer token) for reading and OAuth 1.0a for posting
 */
export declare class XClient {
    /**
     * Make a request with Bearer token (App-only auth)
     * Used for: Filtered stream, reading tweets, etc.
     */
    bearerRequest<T>(url: string, method?: 'GET' | 'POST' | 'DELETE', body?: object): Promise<T>;
    /**
     * Make a request with OAuth 1.0a (User context auth)
     * Used for: Posting tweets, managing user data
     */
    oauth1Request<T>(url: string, method?: 'GET' | 'POST' | 'DELETE', body?: object): Promise<T>;
    /**
     * Generate OAuth 1.0a parameters
     */
    private generateOAuthParams;
    /**
     * Build OAuth Authorization header
     */
    private buildOAuthHeader;
    /**
     * Get current stream rules
     */
    getStreamRules(): Promise<RulesResponse>;
    /**
     * Add stream rules
     */
    addStreamRules(rules: StreamRule[]): Promise<RulesResponse>;
    /**
     * Delete stream rules by IDs
     */
    deleteStreamRules(ids: string[]): Promise<RulesResponse>;
    /**
     * Get a tweet by ID (with media attachments)
     */
    getTweet(tweetId: string): Promise<{
        data: Tweet;
        includes?: {
            users?: User[];
            media?: Media[];
        };
    }>;
    /**
     * Search tweets (for getting conversation thread with media)
     */
    searchTweets(query: string, maxResults?: number): Promise<{
        data?: Tweet[];
        includes?: {
            users?: User[];
            media?: Media[];
        };
    }>;
    /**
     * Post a tweet (reply)
     * @param text - Tweet text
     * @param replyToId - Optional tweet ID to reply to
     * @param nullcast - If true, tweet won't appear in timelines (default: false)
     */
    postTweet(text: string, replyToId?: string, nullcast?: boolean): Promise<{
        data: Tweet;
    }>;
    /**
     * Get user by username
     */
    getUserByUsername(username: string): Promise<{
        data: User;
    }>;
}
export declare const xClient: XClient;
//# sourceMappingURL=x-client.d.ts.map