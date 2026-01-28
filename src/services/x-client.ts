import crypto from 'crypto';
import { config } from '../config';
import { Tweet, User, RulesResponse, StreamRule } from '../types';

/**
 * X API Client
 * Handles both OAuth 2.0 (Bearer token) for reading and OAuth 1.0a for posting
 */
export class XClient {
  
  /**
   * Make a request with Bearer token (App-only auth)
   * Used for: Filtered stream, reading tweets, etc.
   */
  async bearerRequest<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`X API Error (${response.status}): ${errorText}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Make a request with OAuth 1.0a (User context auth)
   * Used for: Posting tweets, managing user data
   */
  async oauth1Request<T>(
    url: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const oauthParams = this.generateOAuthParams(url, method, body);
    
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': this.buildOAuthHeader(oauthParams),
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`X API Error (${response.status}): ${errorText}`);
    }
    
    return response.json() as Promise<T>;
  }
  
  /**
   * Generate OAuth 1.0a parameters
   */
  private generateOAuthParams(
    url: string,
    method: string,
    _body?: object
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: config.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: config.accessToken,
      oauth_version: '1.0',
    };
    
    // Create signature base string
    const paramString = Object.keys(oauthParams)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(oauthParams[key])}`)
      .join('&');
    
    const signatureBase = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(paramString),
    ].join('&');
    
    // Create signing key
    const signingKey = `${encodeURIComponent(config.apiSecret)}&${encodeURIComponent(config.accessTokenSecret)}`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(signatureBase)
      .digest('base64');
    
    oauthParams.oauth_signature = signature;
    
    return oauthParams;
  }
  
  /**
   * Build OAuth Authorization header
   */
  private buildOAuthHeader(params: Record<string, string>): string {
    const headerParams = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
      .join(', ');
    
    return `OAuth ${headerParams}`;
  }
  
  /**
   * Get current stream rules
   */
  async getStreamRules(): Promise<RulesResponse> {
    return this.bearerRequest<RulesResponse>(config.endpoints.filteredStreamRules);
  }
  
  /**
   * Add stream rules
   */
  async addStreamRules(rules: StreamRule[]): Promise<RulesResponse> {
    return this.bearerRequest<RulesResponse>(
      config.endpoints.filteredStreamRules,
      'POST',
      { add: rules }
    );
  }
  
  /**
   * Delete stream rules by IDs
   */
  async deleteStreamRules(ids: string[]): Promise<RulesResponse> {
    return this.bearerRequest<RulesResponse>(
      config.endpoints.filteredStreamRules,
      'POST',
      { delete: { ids } }
    );
  }
  
  /**
   * Get a tweet by ID
   */
  async getTweet(tweetId: string): Promise<{ data: Tweet; includes?: { users?: User[] } }> {
    const params = new URLSearchParams({
      'tweet.fields': 'author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets',
      'expansions': 'author_id,referenced_tweets.id',
      'user.fields': 'name,username',
    });
    
    const url = `${config.endpoints.tweets}/${tweetId}?${params}`;
    return this.bearerRequest(url);
  }
  
  /**
   * Search tweets (for getting conversation thread)
   */
  async searchTweets(query: string, maxResults = 100): Promise<{ data?: Tweet[]; includes?: { users?: User[] } }> {
    const params = new URLSearchParams({
      query,
      max_results: maxResults.toString(),
      'tweet.fields': 'author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets',
      'expansions': 'author_id,referenced_tweets.id',
      'user.fields': 'name,username',
    });
    
    const url = `https://api.x.com/2/tweets/search/recent?${params}`;
    return this.bearerRequest(url);
  }
  
  /**
   * Post a tweet (reply)
   */
  async postTweet(text: string, replyToId?: string): Promise<{ data: Tweet }> {
    const body: { text: string; reply?: { in_reply_to_tweet_id: string } } = { text };
    
    if (replyToId) {
      body.reply = { in_reply_to_tweet_id: replyToId };
    }
    
    return this.oauth1Request(config.endpoints.tweets, 'POST', body);
  }
  
  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<{ data: User }> {
    const url = `${config.endpoints.users}/by/username/${username}`;
    return this.bearerRequest(url);
  }
}

export const xClient = new XClient();
