import { ConversationThread } from '../types';
/**
 * Conversation Service
 * Fetches and organizes conversation threads from X
 */
export declare class ConversationService {
    /**
     * Get the full conversation thread for a given tweet
     * Uses conversation_id to find all tweets in the thread
     */
    getConversationThread(tweetId: string): Promise<ConversationThread>;
    /**
     * Extract travel-related context from a conversation
     * This is a simple extraction - can be enhanced with NLP/AI later
     */
    extractTravelContext(thread: ConversationThread): TravelContext;
    /**
     * Extract potential destination names
     */
    private extractDestinations;
    /**
     * Extract date-related mentions
     */
    private extractDates;
    /**
     * Extract number of travelers
     */
    private extractTravelerCount;
    /**
     * Extract travel preferences
     */
    private extractPreferences;
    /**
     * Format conversation for display/logging
     */
    formatConversation(thread: ConversationThread): string;
}
export interface TravelContext {
    destinations: string[];
    dates: string[];
    travelers?: number;
    preferences: string[];
    rawText: string;
}
export declare const conversationService: ConversationService;
//# sourceMappingURL=conversation.d.ts.map