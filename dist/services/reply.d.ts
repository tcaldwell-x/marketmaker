/**
 * Reply Service
 * Handles posting replies to tweets
 */
import { User } from '../types';
declare class ReplyService {
    private repliedTweets;
    private maxTrackedReplies;
    /**
     * Check if we've already replied to a tweet
     */
    hasReplied(tweetId: string): boolean;
    /**
     * Mark a tweet as replied to
     */
    markReplied(tweetId: string): void;
    /**
     * Post a reply to a tweet
     */
    reply(text: string, replyToId: string, author?: User): Promise<void>;
}
export declare const replyService: ReplyService;
export {};
//# sourceMappingURL=reply.d.ts.map