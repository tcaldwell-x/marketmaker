import { autoBot } from './bot';
import { validateConfig } from './config';

async function main() {
  try {
    // Validate configuration before starting
    validateConfig();
    
    // Start the bot
    await autoBot.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down...');
      await autoBot.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down...');
      await autoBot.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
