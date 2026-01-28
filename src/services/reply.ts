/**
 * Reply Service
 * Handles posting replies to tweets
 */

import { xClient } from './x-client';
import { User } from '../types';

class ReplyService {
  // Track tweets we've already replied to (to prevent duplicates)
  private repliedTweets: Set<string> = new Set();
  
  // Maximum size of the set before we start clearing old entries
  private maxTrackedReplies = 10000;

  /**
   * Check if we've already replied to a tweet
   */
  hasReplied(tweetId: string): boolean {
    return this.repliedTweets.has(tweetId);
  }

  /**
   * Mark a tweet as replied to
   */
  markReplied(tweetId: string): void {
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
  async reply(text: string, replyToId: string, author?: User): Promise<void> {
    try {
      // Mark as replied before posting to prevent race conditions
      this.markReplied(replyToId);
      
      console.log(`[Reply] Posting reply to ${replyToId}:`);
      console.log(`[Reply] Text (${text.length} chars): ${text}`);
      
      if (author) {
        console.log(`[Reply] Replying to @${author.username}`);
      }
      
      const result = await xClient.postTweet(text, replyToId, true);
      
      console.log(`[Reply] ✅ Posted successfully! Tweet ID: ${result.data.id}`);
    } catch (error) {
      // Remove from replied set if posting failed
      this.repliedTweets.delete(replyToId);
      
      console.error('[Reply] ❌ Failed to post reply:', error);
      throw error;
    }
  }
}

export const replyService = new ReplyService();
