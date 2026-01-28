/**
 * XBot Framework - Core Types
 * 
 * This file defines the interfaces for building custom bot plugins.
 * Implement these interfaces to create your own bot powered by Grok.
 */

import { ConversationThread } from '../types';

/**
 * Tool definition for Grok function calling
 * Compatible with OpenAI/xAI function calling format
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ToolParameter;
}

/**
 * Result of executing a tool
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Context passed to tool handlers
 */
export interface ToolContext {
  thread: ConversationThread;
  toolName: string;
  arguments: Record<string, unknown>;
}

/**
 * Response from processing a conversation
 */
export interface BotResponse {
  /** The message to tweet */
  message: string;
  /** Whether this response includes recommendations/data that should be linked */
  hasData: boolean;
  /** Data to store for the website (if hasData is true) */
  data?: StorableData;
  /** Direct URL to link to (if not using website storage) */
  directUrl?: string;
}

/**
 * Data that can be stored and linked to in tweets
 */
export interface StorableData {
  /** Primary identifier/title */
  title: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Primary item (e.g., hotel, product) */
  primaryItem?: {
    name: string;
    price?: string;
    rating?: number;
    imageUrl?: string;
  };
  /** Secondary item (e.g., activity, addon) */
  secondaryItem?: {
    name: string;
    price?: string;
  };
  /** URL to the actual booking/purchase page */
  actionUrl: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Bot Plugin Interface
 * 
 * Implement this interface to create a custom bot.
 * 
 * @example
 * ```typescript
 * const myPlugin: BotPlugin = {
 *   id: 'my-plugin',
 *   name: 'My Custom Bot',
 *   description: 'A bot that does cool things',
 *   version: '1.0.0',
 *   
 *   systemPrompt: `You are a helpful assistant...`,
 *   
 *   tools: [
 *     {
 *       type: 'function',
 *       function: {
 *         name: 'search_products',
 *         description: 'Search for products',
 *         parameters: { ... }
 *       }
 *     }
 *   ],
 *   
 *   async initialize(config) {
 *     // Setup API clients, etc.
 *   },
 *   
 *   async executeTool(context) {
 *     // Handle tool execution
 *   }
 * };
 * ```
 */
export interface BotPlugin {
  /** Unique plugin identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of what this bot does */
  description: string;
  
  /** Plugin version */
  version: string;
  
  /**
   * System prompt for Grok
   * This defines the bot's personality, capabilities, and behavior rules.
   * 
   * The framework will automatically append:
   * - Today's date
   * - Character limit reminders
   */
  systemPrompt: string;
  
  /**
   * Tools available to Grok for function calling
   * These define what actions the bot can take.
   */
  tools: Tool[];
  
  /**
   * Initialize the plugin
   * Called once when the bot starts.
   * Use this to set up API clients, validate config, etc.
   */
  initialize(config: PluginConfig): Promise<void>;
  
  /**
   * Execute a tool call from Grok
   * Called when Grok decides to use one of your tools.
   * 
   * @param context - Contains the tool name, arguments, and conversation thread
   * @returns The result to send back to Grok
   */
  executeTool(context: ToolContext): Promise<ToolResult>;
  
  /**
   * Format the final response (optional)
   * Override this to customize how responses are formatted.
   * 
   * @param grokMessage - The message Grok generated
   * @param toolResults - Results from any tool calls
   * @returns Formatted bot response
   */
  formatResponse?(grokMessage: string, toolResults: ToolResult[]): Promise<BotResponse>;
  
  /**
   * Extract storable data from tool results (optional)
   * Override this to customize what data gets stored for website links.
   * 
   * @param toolResults - Results from tool calls
   * @param grokMessage - The message Grok generated (to help identify which item was recommended)
   * @returns Data to store, or null if no link should be added
   */
  extractStorableData?(toolResults: ToolResult[], grokMessage?: string): StorableData | null;
  
  /**
   * Cleanup when bot stops (optional)
   */
  shutdown?(): Promise<void>;
}

/**
 * Configuration passed to plugins
 */
export interface PluginConfig {
  /** Environment variables (filtered to plugin-relevant ones) */
  env: Record<string, string | undefined>;
  
  /** Bot username on X */
  botUsername: string;
  
  /** Website URL for storing/displaying data */
  websiteUrl: string;
  
  /** Whether to use sandbox/test mode */
  sandboxMode: boolean;
}

/**
 * Framework configuration
 */
export interface FrameworkConfig {
  /** X API credentials */
  x: {
    bearerToken: string;
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  
  /** Grok API key */
  grokApiKey: string;
  
  /** Bot username on X */
  botUsername: string;
  
  /** Website URL for recommendation links */
  websiteUrl: string;
  
  /** Plugin to use */
  pluginId: string;
  
  /** Plugin-specific configuration */
  pluginConfig: Record<string, unknown>;
}
