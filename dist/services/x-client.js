"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.xClient = exports.XClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
/**
 * X API Client
 * Handles both OAuth 2.0 (Bearer token) for reading and OAuth 1.0a for posting
 */
class XClient {
    /**
     * Make a request with Bearer token (App-only auth)
     * Used for: Filtered stream, reading tweets, etc.
     */
    async bearerRequest(url, method = 'GET', body) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${config_1.config.bearerToken}`,
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
        return response.json();
    }
    /**
     * Make a request with OAuth 1.0a (User context auth)
     * Used for: Posting tweets, managing user data
     */
    async oauth1Request(url, method = 'GET', body) {
        const oauthParams = this.generateOAuthParams(url, method, body);
        const options = {
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
        return response.json();
    }
    /**
     * Generate OAuth 1.0a parameters
     */
    generateOAuthParams(url, method, _body) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = crypto_1.default.randomBytes(16).toString('hex');
        const oauthParams = {
            oauth_consumer_key: config_1.config.apiKey,
            oauth_nonce: nonce,
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: timestamp,
            oauth_token: config_1.config.accessToken,
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
        const signingKey = `${encodeURIComponent(config_1.config.apiSecret)}&${encodeURIComponent(config_1.config.accessTokenSecret)}`;
        // Generate signature
        const signature = crypto_1.default
            .createHmac('sha1', signingKey)
            .update(signatureBase)
            .digest('base64');
        oauthParams.oauth_signature = signature;
        return oauthParams;
    }
    /**
     * Build OAuth Authorization header
     */
    buildOAuthHeader(params) {
        const headerParams = Object.keys(params)
            .sort()
            .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
            .join(', ');
        return `OAuth ${headerParams}`;
    }
    /**
     * Get current stream rules
     */
    async getStreamRules() {
        return this.bearerRequest(config_1.config.endpoints.filteredStreamRules);
    }
    /**
     * Add stream rules
     */
    async addStreamRules(rules) {
        return this.bearerRequest(config_1.config.endpoints.filteredStreamRules, 'POST', { add: rules });
    }
    /**
     * Delete stream rules by IDs
     */
    async deleteStreamRules(ids) {
        return this.bearerRequest(config_1.config.endpoints.filteredStreamRules, 'POST', { delete: { ids } });
    }
    /**
     * Get a tweet by ID (with media attachments)
     */
    async getTweet(tweetId) {
        const params = new URLSearchParams({
            'tweet.fields': 'author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets,attachments',
            'expansions': 'author_id,referenced_tweets.id,attachments.media_keys',
            'user.fields': 'name,username',
            'media.fields': 'type,url,preview_image_url,width,height,alt_text',
        });
        const url = `${config_1.config.endpoints.tweets}/${tweetId}?${params}`;
        return this.bearerRequest(url);
    }
    /**
     * Search tweets (for getting conversation thread with media)
     */
    async searchTweets(query, maxResults = 100) {
        const params = new URLSearchParams({
            query,
            max_results: maxResults.toString(),
            'tweet.fields': 'author_id,conversation_id,created_at,in_reply_to_user_id,referenced_tweets,attachments',
            'expansions': 'author_id,referenced_tweets.id,attachments.media_keys',
            'user.fields': 'name,username',
            'media.fields': 'type,url,preview_image_url,width,height,alt_text',
        });
        const url = `https://api.x.com/2/tweets/search/recent?${params}`;
        return this.bearerRequest(url);
    }
    /**
     * Post a tweet (reply)
     * @param text - Tweet text
     * @param replyToId - Optional tweet ID to reply to
     * @param nullcast - If true, tweet won't appear in timelines (default: false)
     */
    async postTweet(text, replyToId, nullcast = false) {
        const body = {
            text,
        };
        if (replyToId) {
            body.reply = { in_reply_to_tweet_id: replyToId };
        }
        if (nullcast) {
            body.nullcast = true;
        }
        return this.oauth1Request(config_1.config.endpoints.tweets, 'POST', body);
    }
    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        const url = `${config_1.config.endpoints.users}/by/username/${username}`;
        return this.bearerRequest(url);
    }
}
exports.XClient = XClient;
exports.xClient = new XClient();
//# sourceMappingURL=x-client.js.map