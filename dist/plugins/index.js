"use strict";
/**
 * XBot Framework - Available Plugins
 *
 * Register your plugins here to make them available to the framework.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionMarketPlugin = exports.availablePlugins = void 0;
exports.getPlugin = getPlugin;
exports.listAvailablePlugins = listAvailablePlugins;
const prediction_market_1 = require("./prediction-market");
/**
 * All available plugins
 * Add your custom plugins to this array
 */
exports.availablePlugins = [
    prediction_market_1.predictionMarketPlugin,
    // Legacy plugins (uncomment to enable):
    // expediaPlugin,
    // opentablePlugin,
];
/**
 * Get a plugin by ID
 */
function getPlugin(id) {
    return exports.availablePlugins.find(p => p.id === id);
}
/**
 * List all available plugin IDs
 */
function listAvailablePlugins() {
    return exports.availablePlugins.map(p => p.id);
}
// Re-export plugins for direct imports
var prediction_market_2 = require("./prediction-market");
Object.defineProperty(exports, "predictionMarketPlugin", { enumerable: true, get: function () { return prediction_market_2.predictionMarketPlugin; } });
//# sourceMappingURL=index.js.map