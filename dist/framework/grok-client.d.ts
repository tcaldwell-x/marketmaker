/**
 * XBot Framework - Grok Client
 *
 * Generic Grok client that works with any plugin.
 * Handles the conversation loop with function calling.
 */
import { ConversationThread } from '../types';
import { ToolResult, BotResponse } from './types';
/**
 * Process a conversation thread using Grok and the active plugin
 */
export declare function processWithGrok(thread: ConversationThread): Promise<GrokProcessResult>;
/**
 * Check if Grok is configured
 */
export declare function isGrokConfigured(): boolean;
export interface GrokProcessResult {
    response: BotResponse;
    hadToolCalls: boolean;
    toolResults: ToolResult[];
}
//# sourceMappingURL=grok-client.d.ts.map