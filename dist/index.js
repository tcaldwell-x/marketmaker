"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const config_1 = require("./config");
async function main() {
    try {
        // Validate configuration before starting
        (0, config_1.validateConfig)();
        // Start the bot
        await bot_1.autoBot.start();
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nReceived SIGINT, shutting down...');
            await bot_1.autoBot.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\nReceived SIGTERM, shutting down...');
            await bot_1.autoBot.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map