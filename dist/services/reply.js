"use strict";
/**
 * Reply Service
 * Handles posting replies to tweets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyService = void 0;
const x_client_1 = require("./x-client");
class ReplyService {
    // Track tweets we've already replied to (to prevent duplicates)
    repliedTweets = new Set();
    // Maximum size of the set before we start clearing old entries
    maxTrackedReplies = 10000;
    /**
     * Check if we've already replied to a tweet
     */
    hasReplied(tweetId) {
        return this.repliedTweets.has(tweetId);
    }
    /**
     * Mark a tweet as replied to
     */
    markReplied(tweetId) {
        // Clear old entries if we're getting too big
        if (this.repliedTweets.size >= this.maxTrackedReplies) {
            const entries = Array.from(this.repliedTweets);
            // Remove the oldest half
            entries.slice(0, this.maxTrackedReplies / 2).forEach(id => {
                this.repliedTweets.delete(id);
            });
        }
        this.repliedTweets.add(tweetId);
    }
    /**
     * Post a reply to a tweet
     */
    async reply(text, replyToId, author) {
        try {
            // Mark as replied before posting to prevent race conditions
            this.markReplied(replyToId);
            console.log(`[Reply] Posting reply to ${replyToId}:`);
            console.log(`[Reply] Text (${text.length} chars): ${text}`);
            if (author) {
                console.log(`[Reply] Replying to @${author.username}`);
            }
            const result = await x_client_1.xClient.postTweet(text, replyToId, true);
            console.log(`[Reply] ✅ Posted successfully! Tweet ID: ${result.data.id}`);
        }
        catch (error) {
            // Remove from replied set if posting failed
            this.repliedTweets.delete(replyToId);
            console.error('[Reply] ❌ Failed to post reply:', error);
            throw error;
        }
    }
}
exports.replyService = new ReplyService();
//# sourceMappingURL=reply.js.map