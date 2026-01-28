"use strict";
/**
 * XBot Framework - Main Exports
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginManager = exports.isGrokConfigured = exports.processWithGrok = void 0;
__exportStar(require("./types"), exports);
var grok_client_1 = require("./grok-client");
Object.defineProperty(exports, "processWithGrok", { enumerable: true, get: function () { return grok_client_1.processWithGrok; } });
Object.defineProperty(exports, "isGrokConfigured", { enumerable: true, get: function () { return grok_client_1.isGrokConfigured; } });
/**
 * Plugin Manager
 * Handles plugin registration, activation, and lifecycle
 */
class PluginManager {
    plugins = new Map();
    activePlugin = null;
    pluginConfig = null;
    /**
     * Register a plugin
     */
    register(plugin) {
        this.plugins.set(plugin.id, plugin);
        console.log(`[PluginManager] Registered plugin: ${plugin.id} (${plugin.name})`);
    }
    /**
     * Activate a plugin by ID
     */
    async activate(pluginId, config) {
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
    isReady() {
        return this.activePlugin !== null;
    }
    /**
     * Get the active plugin
     */
    getActivePlugin() {
        return this.activePlugin;
    }
    /**
     * Get the system prompt from the active plugin
     */
    getSystemPrompt() {
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
    async executeTool(context) {
        if (!this.activePlugin) {
            throw new Error('No active plugin');
        }
        console.log(`[PluginManager] Executing tool: ${context.toolName}`);
        return this.activePlugin.executeTool(context);
    }
    /**
     * Shutdown the active plugin
     */
    async shutdown() {
        if (this.activePlugin && this.activePlugin.shutdown) {
            await this.activePlugin.shutdown();
        }
        this.activePlugin = null;
        this.pluginConfig = null;
    }
}
exports.pluginManager = new PluginManager();
//# sourceMappingURL=index.js.map