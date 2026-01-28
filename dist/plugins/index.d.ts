/**
 * XBot Framework - Available Plugins
 *
 * Register your plugins here to make them available to the framework.
 */
import { BotPlugin } from '../framework/types';
/**
 * All available plugins
 * Add your custom plugins to this array
 */
export declare const availablePlugins: BotPlugin[];
/**
 * Get a plugin by ID
 */
export declare function getPlugin(id: string): BotPlugin | undefined;
/**
 * List all available plugin IDs
 */
export declare function listAvailablePlugins(): string[];
export { predictionMarketPlugin } from './prediction-market';
//# sourceMappingURL=index.d.ts.map