import { xClient } from './x-client';
import { Tweet, User } from '../types';

/**
 * Reply Service
 * Handles posting replies to tweets
 */
export class ReplyService {
  private processedTweets = new Set<string>();
  
  /**
   * Reply to a tweet
   * @param text - The reply text
   * @param replyToTweetId - The tweet ID to reply to
   * @param mentionUser - Optional user to @mention at the start
   */
  async reply(
    text: string,
    replyToTweetId: string,
    mentionUser?: User
  ): Promise<Tweet | null> {
    // Check if we've already processed this tweet
    if (this.processedTweets.has(replyToTweetId)) {
      console.log(`[Reply] Already replied to tweet ${replyToTweetId}, skipping`);
      return null;
    }
    
    try {
      // Prepend @username if provided (X requires mentioning the user you're replying to)
      let replyText = text;
      if (mentionUser && !text.startsWith(`@${mentionUser.username}`)) {
        replyText = `@${mentionUser.username} ${text}`;
      }
      
      // Ensure we don't exceed character limit
      if (replyText.length > 280) {
        console.warn('[Reply] Text exceeds 280 chars, truncating');
        replyText = replyText.slice(0, 277) + '...';
      }
      
      console.log(`[Reply] Posting reply to tweet ${replyToTweetId}`);
      console.log(`[Reply] Text: ${replyText}`);
      
      const response = await xClient.postTweet(replyText, replyToTweetId);
      
      // Mark as processed
      this.processedTweets.add(replyToTweetId);
      
      console.log(`[Reply] Successfully posted reply: ${response.data.id}`);
      
      return response.data;
    } catch (error) {
      console.error(`[Reply] Failed to post reply:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a tweet has already been replied to
   */
  hasReplied(tweetId: string): boolean {
    return this.processedTweets.has(tweetId);
  }
  
  /**
   * Clear the processed tweets cache
   * (useful for testing or if the bot restarts)
   */
  clearCache(): void {
    this.processedTweets.clear();
  }
  
  /**
   * Get count of processed tweets
   */
  getProcessedCount(): number {
    return this.processedTweets.size;
  }
}

export const replyService = new ReplyService();
