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
class PluginManager {
  private plugins: Map<string, BotPlugin> = new Map();
  private activePlugin: BotPlugin | null = null;
  private pluginConfig: PluginConfig | null = null;

  /**
   * Register a plugin
   */
  register(plugin: BotPlugin): void {
    this.plugins.set(plugin.id, plugin);
    console.log(`[PluginManager] Registered plugin: ${plugin.id} (${plugin.name})`);
  }

  /**
   * Activate a plugin by ID
   */
  async activate(pluginId: string, config: PluginConfig): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // Shutdown current plugin if any
    if (this.activePlugin && this.activePlugin.shutdown) {
      await this.activePlugin.shutdown();
    }

    // Initialize and activate new plugin
    await plugin.initialize(config);
    this.activePlugin = plugin;
    this.pluginConfig = config;
    
    console.log(`[PluginManager] Activated plugin: ${plugin.id}`);
  }

  /**
   * Check if a plugin is active and ready
   */
  isReady(): boolean {
    return this.activePlugin !== null;
  }

  /**
   * Get the active plugin
   */
  getActivePlugin(): BotPlugin | null {
    return this.activePlugin;
  }

  /**
   * Get the system prompt from the active plugin
   */
  getSystemPrompt(): string {
    if (!this.activePlugin) {
      throw new Error('No active plugin');
    }

    // Add date context to the system prompt
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `${this.activePlugin.systemPrompt}\n\nToday's date is ${today}.`;
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
   * Execute a tool through the active plugin
   */
  async executeTool(context: ToolContext): Promise<ToolResult> {
    if (!this.activePlugin) {
      throw new Error('No active plugin');
    }
    
    console.log(`[PluginManager] Executing tool: ${context.toolName}`);
    return this.activePlugin.executeTool(context);
  }

  /**
   * Shutdown the active plugin
   */
  async shutdown(): Promise<void> {
    if (this.activePlugin && this.activePlugin.shutdown) {
      await this.activePlugin.shutdown();
    }
    this.activePlugin = null;
    this.pluginConfig = null;
  }
}

export const pluginManager = new PluginManager();
