import { validateConfig } from './config';
import { autoBot } from './bot';

/**
 * Main entry point for AutoBot
 */
async function main(): Promise<void> {
  console.log('🚀 Initializing AutoBot...\n');
  
  // Validate configuration
  try {
    validateConfig();
    console.log('✅ Configuration validated\n');
  } catch (error) {
    console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
  
  // Setup graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n📴 Received SIGINT, shutting down gracefully...');
    autoBot.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n📴 Received SIGTERM, shutting down gracefully...');
    autoBot.stop();
    process.exit(0);
  });
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    autoBot.stop();
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled rejection:', reason);
  });
  
  // Start the bot
  try {
    await autoBot.start();
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Run
main();
