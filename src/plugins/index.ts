/**
 * XBot Framework - Available Plugins
 * 
 * Register your plugins here to make them available to the framework.
 */

import { BotPlugin } from '../framework/types';
import { expediaPlugin } from './expedia';

/**
 * All available plugins
 * Add your custom plugins to this array
 */
export const availablePlugins: BotPlugin[] = [
  expediaPlugin,
  // Add more plugins here:
  // myCustomPlugin,
];

/**
 * Get a plugin by ID
 */
export function getPlugin(id: string): BotPlugin | undefined {
  return availablePlugins.find(p => p.id === id);
}

/**
 * List all available plugin IDs
 */
export function listAvailablePlugins(): string[] {
  return availablePlugins.map(p => p.id);
}

// Re-export plugins for direct imports
export { expediaPlugin } from './expedia';
