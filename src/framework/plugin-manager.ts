/**
 * XBot Framework - Plugin Manager
 * 
 * Handles loading, initializing, and managing bot plugins.
 */

import { BotPlugin, PluginConfig, ToolContext, ToolResult } from './types';

class PluginManager {
  private plugins: Map<string, BotPlugin> = new Map();
  private activePlugin: BotPlugin | null = null;
  private initialized = false;

  /**
   * Register a plugin
   */
  register(plugin: BotPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginManager] Plugin "${plugin.id}" already registered, overwriting`);
    }
    this.plugins.set(plugin.id, plugin);
    console.log(`[PluginManager] Registered plugin: ${plugin.name} (${plugin.id}) v${plugin.version}`);
  }

  /**
   * Get all registered plugins
   */
  getRegisteredPlugins(): BotPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * List available plugin IDs
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Activate and initialize a plugin
   */
  async activate(pluginId: string, config: PluginConfig): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      const available = this.listPlugins().join(', ') || 'none';
      throw new Error(
        `Plugin "${pluginId}" not found. Available plugins: ${available}`
      );
    }

    console.log(`[PluginManager] Activating plugin: ${plugin.name}`);
    
    try {
      await plugin.initialize(config);
      this.activePlugin = plugin;
      this.initialized = true;
      console.log(`[PluginManager] ✅ Plugin "${plugin.name}" activated successfully`);
    } catch (error) {
      console.error(`[PluginManager] ❌ Failed to initialize plugin "${plugin.name}":`, error);
      throw error;
    }
  }

  /**
   * Get the active plugin
   */
  getActivePlugin(): BotPlugin | null {
    return this.activePlugin;
  }

  /**
   * Check if a plugin is active and initialized
   */
  isReady(): boolean {
    return this.initialized && this.activePlugin !== null;
  }

  /**
   * Get the system prompt from the active plugin
   */
  getSystemPrompt(): string {
    if (!this.activePlugin) {
      throw new Error('No active plugin');
    }

    // Base system prompt from plugin
    let prompt = this.activePlugin.systemPrompt;

    // Append framework-level instructions
    prompt += `\n\nIMPORTANT RULES (enforced by framework):
- Today's date is: ${new Date().toISOString().split('T')[0]}
- Twitter has a 280 character limit
- When providing data/recommendations that will include a link, keep your response under 200 characters
- When having a conversation without links, keep responses under 280 characters
- Be concise - every character counts on Twitter`;

    return prompt;
  }

  /**
   * Get tools from the active plugin
   */
  getTools() {
    if (!this.activePlugin) {
      throw new Error('No active plugin');
    }
    return this.activePlugin.tools;
  }

  /**
   * Execute a tool call
   */
  async executeTool(context: ToolContext): Promise<ToolResult> {
    if (!this.activePlugin) {
      throw new Error('No active plugin');
    }

    console.log(`[PluginManager] Executing tool: ${context.toolName}`);
    
    try {
      const result = await this.activePlugin.executeTool(context);
      console.log(`[PluginManager] Tool "${context.toolName}" completed:`, 
        result.success ? 'success' : 'failed');
      return result;
    } catch (error) {
      console.error(`[PluginManager] Tool "${context.toolName}" threw error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Shutdown the active plugin
   */
  async shutdown(): Promise<void> {
    if (this.activePlugin?.shutdown) {
      console.log(`[PluginManager] Shutting down plugin: ${this.activePlugin.name}`);
      await this.activePlugin.shutdown();
    }
    this.activePlugin = null;
    this.initialized = false;
  }
}

// Singleton instance
export const pluginManager = new PluginManager();
