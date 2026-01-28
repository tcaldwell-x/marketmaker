/**
 * XBot Framework
 * 
 * A framework for building X/Twitter bots powered by Grok AI.
 * 
 * @example
 * ```typescript
 * import { pluginManager, BotPlugin } from './framework';
 * 
 * // Define your plugin
 * const myPlugin: BotPlugin = {
 *   id: 'my-bot',
 *   name: 'My Bot',
 *   // ... implementation
 * };
 * 
 * // Register and activate
 * pluginManager.register(myPlugin);
 * await pluginManager.activate('my-bot', config);
 * ```
 */

// Core types
export type {
  BotPlugin,
  Tool,
  ToolParameter,
  ToolResult,
  ToolContext,
  BotResponse,
  StorableData,
  PluginConfig,
  FrameworkConfig,
} from './types';

// Plugin manager
export { pluginManager } from './plugin-manager';

// Grok client
export { processWithGrok, isGrokConfigured } from './grok-client';
export type { GrokProcessResult } from './grok-client';
