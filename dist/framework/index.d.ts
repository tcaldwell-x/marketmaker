/**
 * XBot Framework - Main Exports
 */
export * from './types';
export { processWithGrok, isGrokConfigured } from './grok-client';
export type { GrokProcessResult } from './grok-client';
import { BotPlugin, PluginConfig, ToolContext, ToolResult } from './types';
/**
 * Plugin Manager
 * Handles plugin registration, activation, and lifecycle
 */
declare class PluginManager {
    private plugins;
    private activePlugin;
    private pluginConfig;
    /**
     * Register a plugin
     */
    register(plugin: BotPlugin): void;
    /**
     * Activate a plugin by ID
     */
    activate(pluginId: string, config: PluginConfig): Promise<void>;
    /**
     * Check if a plugin is active and ready
     */
    isReady(): boolean;
    /**
     * Get the active plugin
     */
    getActivePlugin(): BotPlugin | null;
    /**
     * Get the system prompt from the active plugin
     */
    getSystemPrompt(): string;
    /**
     * Get tools from the active plugin
     */
    getTools(): import("./types").Tool[];
    /**
     * Execute a tool through the active plugin
     */
    executeTool(context: ToolContext): Promise<ToolResult>;
    /**
     * Shutdown the active plugin
     */
    shutdown(): Promise<void>;
}
export declare const pluginManager: PluginManager;
//# sourceMappingURL=index.d.ts.map